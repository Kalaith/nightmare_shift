# nightmare_shift Publishing Script
# Publishes React frontend to preview/production environments

param(
    [switch]$Frontend,
    [switch]$Backend,
    [switch]$All,
    [switch]$Clean,
    [switch]$Verbose,
    [switch]$Production,
    [switch]$Prod
)

# Configuration
$SOURCE_DIR = "H:\Claude\nightmare_shift"
$PREVIEW_ROOT = "H:\xampp\htdocs"
$PRODUCTION_ROOT = "F:\WebHatchery"

# Determine environment - production if any production flag is set, otherwise preview
$Environment = if ($Production -or $Prod) { 'production' } else { 'preview' }

# Set destination based on environment
$DEST_ROOT = if ($Environment -eq 'preview') { $PREVIEW_ROOT } else { $PRODUCTION_ROOT }
$DEST_DIR = Join-Path $DEST_ROOT "nightmare_shift"
$FRONTEND_SRC = "$SOURCE_DIR\nightmare-shift-react"
$BACKEND_SRC = "$SOURCE_DIR\backend"  # For future use when backend is added
$FRONTEND_DEST = $DEST_DIR  # Frontend goes to root, not subdirectory
$BACKEND_DEST = "$DEST_DIR\backend"   # For future use

# Color output functions
function Write-Success($message) {
    Write-Host $message -ForegroundColor Green
}

function Write-Info($message) {
    Write-Host $message -ForegroundColor Cyan
}

function Write-Warning($message) {
    Write-Host $message -ForegroundColor Yellow
}

function Write-Error($message) {
    Write-Host $message -ForegroundColor Red
}

function Write-Progress($message) {
    Write-Host $message -ForegroundColor Magenta
}

# Ensure destination directory exists
function Ensure-Directory($path) {
    if (!(Test-Path $path)) {
        New-Item -ItemType Directory -Path $path -Force | Out-Null
        Write-Info "Created directory: $path"
    }
}

# Clean destination directory
function Clean-Directory($path) {
    if (Test-Path $path) {
        Write-Warning "Cleaning directory: $path"
        Remove-Item -Path "$path\*" -Recurse -Force
        Write-Success "Directory cleaned"
    }
}

# Build frontend
function Build-Frontend {
    Write-Progress "Building Xytherra frontend..."
    Set-Location $FRONTEND_SRC
    
    # Check if this is actually the React project
    if (!(Test-Path "package.json")) {
        Write-Error "Frontend source directory doesn't contain package.json. Expected React project at: $FRONTEND_SRC"
        return $false
    }
    
    # Install dependencies if node_modules doesn't exist
    if (!(Test-Path "node_modules")) {
        Write-Info "Installing frontend dependencies..."
        npm install
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Failed to install frontend dependencies"
            return $false
        }
    }
    
    # Build the frontend
    Write-Info "Building frontend for production..."
    $env:NODE_ENV = "production"
    
    # Build for production (automatically uses /xytherra/ base path)
    Write-Info "Building for $Environment environment..."
    npm run build
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to build frontend"
        return $false
    }
    
    Write-Success "Frontend build completed"
    return $true
}

# Publish frontend
function Publish-Frontend {
    Write-Progress "Publishing frontend..."
    
    # Build first
    if (!(Build-Frontend)) {
        return $false
    }
    
    # Clean destination if requested (but preserve backend directory if it exists)
    if ($Clean) {
        Write-Warning "Cleaning frontend files from destination (preserving backend)..."
        # Clean only frontend files, not the backend directory
        Get-ChildItem -Path $FRONTEND_DEST -Exclude "backend" -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
        Write-Success "Frontend files cleaned"
    }
    
    # Copy built files (dist folder) to destination
    $distPath = "$FRONTEND_SRC\dist"
    if (Test-Path $distPath) {
        Write-Info "Copying built frontend files to destination..."
        
        # Ensure destination exists
        Ensure-Directory $FRONTEND_DEST
        
        # Get all items from the dist folder
        Get-ChildItem -Path $distPath | ForEach-Object {
            $sourceItem = $_.FullName
            $itemName = $_.Name
            $destPath = Join-Path $FRONTEND_DEST $itemName
            
            # Don't overwrite backend directory
            if ($itemName -ne "backend") {
                # If destination exists and it's a directory, remove it first to prevent nesting
                if ((Test-Path $destPath) -and (Get-Item $destPath).PSIsContainer) {
                    if ($Verbose) { Write-Host "Removing existing directory: $destPath" }
                    Remove-Item $destPath -Recurse -Force -ErrorAction SilentlyContinue
                }
                
                # Copy the item
                if ($_.PSIsContainer) {
                    # For directories, copy contents
                    Copy-Item $sourceItem $destPath -Recurse -Force
                } else {
                    # For files, copy directly
                    Copy-Item $sourceItem $destPath -Force
                }
                
                if ($Verbose) {
                    Write-Host "  Copied: $itemName" -ForegroundColor Gray
                }
            }
        }
        Write-Success "Frontend published to $FRONTEND_DEST"
        return $true
    } else {
        Write-Error "Frontend build output not found at $distPath"
        return $false
    }
}

# Placeholder for future backend functionality
function Publish-Backend {
    Write-Warning "Backend publishing not yet implemented."
    Write-Info "Backend directory will be: $BACKEND_DEST"
    Write-Info "This functionality will be added when PHP backend is developed."
    return $true
}

# Main execution
function Main {
    Write-Info "Xytherra Game Design Document Publishing Script"
    Write-Info "============================================="
    
    # Check if frontend source exists
    if (!(Test-Path $FRONTEND_SRC)) {
        Write-Error "Frontend source directory not found: $FRONTEND_SRC"
        Write-Error "Expected React project directory with package.json"
        exit 1
    }
    
    # Ensure destination directory exists
    Ensure-Directory $DEST_DIR
    
    $success = $true
    
    # Determine what to publish
    if ($Backend -and !(Test-Path $BACKEND_SRC)) {
        Write-Warning "Backend requested but source directory doesn't exist: $BACKEND_SRC"
        Write-Info "Skipping backend publishing..."
        $Backend = $false
    }
    
    if ($All -or (!$Frontend -and !$Backend)) {
        Write-Info "Publishing frontend (backend not available yet)..."
        $Frontend = $true
    }
    
    # Store original location
    $originalLocation = Get-Location
    
    try {
        # Publish frontend
        if ($Frontend) {
            if (!(Publish-Frontend)) {
                $success = $false
            }
        }
        
        # Publish backend (future functionality)
        if ($Backend) {
            if (!(Publish-Backend)) {
                $success = $false
            }
        }
        
        if ($success) {
            Write-Success "`n✅ Publishing completed successfully!"
            Write-Info "Files published to: $DEST_DIR"
            Write-Info "Environment: $Environment"
            
            if ($Environment -eq 'preview') {
                Write-Info "Preview URL: http://localhost/xytherra/"
            }
        } else {
            Write-Error "`n❌ Publishing failed!"
            exit 1
        }
        
    } finally {
        # Return to original location
        Set-Location $originalLocation
    }
}

# Show help
function Show-Help {
    Write-Host @"
Xytherra Game Design Document Publishing Script
===============================================

Usage: .\publish.ps1 [OPTIONS]

OPTIONS:
    -Frontend    Publish only the frontend (React app)
    -Backend     Publish only the backend (not yet implemented)
    -All         Publish both (default, currently only frontend)
    -Clean       Clean destination directories before publishing
    -Verbose     Show detailed output during copying
    -Prod        Deploy to production environment (F:\WebHatchery\xytherra)
    -Production  Deploy to production environment (F:\WebHatchery\xytherra)
    -Help        Show this help message
    
ENVIRONMENT:
    Default: Preview (H:\xampp\htdocs\xytherra)
    Production: Use -Prod or -Production flags

EXAMPLES:
    .\publish.ps1                                       # Publish frontend to preview
    .\publish.ps1 -Prod                                # Publish frontend to production
    .\publish.ps1 -Production                          # Publish frontend to production
    .\publish.ps1 -Clean -Verbose                      # Clean and publish to preview with details
    .\publish.ps1 -Prod -Clean -Verbose                # Clean and publish to production with details

DESCRIPTION:
    This script builds and publishes the Xytherra interactive game design document.
    The React frontend is built using Vite and deployed to the specified environment.
    
    Current project structure:
    H:\Claude\xytherra\
    ├── xytherra-design-doc\   # React frontend (Vite + TypeScript)
    ├── readme.md              # Game design document
    └── CLAUDE.md              # Project documentation
    
    Future backend support will be added when PHP backend is developed.

"@ -ForegroundColor White
}

# Check for help request
if ($args -contains "-Help" -or $args -contains "--help" -or $args -contains "/?" -or $args -contains "-h") {
    Show-Help
    exit 0
}

# Run main function
Main