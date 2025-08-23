# 🚗 Nightmare Shift

A horror-themed taxi driving survival game built with React and Tailwind CSS. Navigate the dark streets as a night shift taxi driver while following mysterious rules to survive until dawn.

## 🎮 Game Overview

You play as a night shift taxi driver in a supernatural world where breaking the rules can mean more than just losing your job. Each shift presents you with mysterious rules to follow while picking up increasingly disturbing passengers.

## ✨ Game Features

### 🌟 Core Gameplay
- **Rule-Based Survival**: Each shift has randomized rules that must be followed to survive
- **Dynamic Passenger System**: Encounter 5 unique supernatural passengers with their own backstories
- **Time Management**: Complete as many rides as possible during an 8-hour shift
- **Resource Management**: Monitor fuel levels and earnings throughout the night
- **Choice-Driven Narrative**: Make decisions that can lead to survival or supernatural consequences

### 📋 Shift Rules System
Five possible rules are randomly selected each shift:
1. **No Eye Contact** - Avoid looking directly at passengers
2. **Silent Night** - No radio or music during rides
3. **Cash Only** - Don't accept tips of any kind
4. **Windows Sealed** - Keep all windows closed
5. **Route Restriction** - Never deviate from GPS routes

### 👻 Supernatural Passengers
- **Mrs. Chen** (👵) - Elderly ghost seeking peace at Riverside Cemetery
- **Jake Morrison** (👨‍💼) - Pale professional with mysterious work at Industrial Warehouse
- **Sarah Woods** (👩‍🦰) - Frightened woman escaping something in the forest
- **Dr. Hollow** (👨‍⚕️) - Former doctor with questionable medical practices
- **The Collector** (🕴️) - Mysterious figure who trades in supernatural artifacts

### 🌍 Atmospheric Locations
- **Downtown Apartments** - Urban decay with flickering streetlights
- **Riverside Cemetery** - Fog-shrouded ancient tombstones
- **Office District** - Glass towers with minimal night lighting
- **Industrial Warehouse** - Abandoned loading docks and chain-link fences
- **Forest Road** - Dark wilderness paths blocked by tall trees
- **Abandoned Hospital** - Medical horror with broken windows

### 🎯 Game Mechanics
- **Fuel System** - Monitor and refuel your vehicle (costs money and time)
- **Earnings Tracking** - Collect fares and manage expenses
- **Inventory System** - Passengers leave mysterious items in your car
- **Multiple Endings** - Survive the shift or face supernatural consequences
- **Replay Value** - Randomized rules and passenger encounters each playthrough

### 💀 Survival Elements
- **Rule Violations** lead to immediate supernatural consequences
- **Passenger Interactions** test your ability to follow the rules
- **Time Pressure** creates urgency in decision-making
- **Resource Scarcity** forces strategic fuel and money management

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### Installation & Development
```bash
# Clone the repository
git clone <repository-url>
cd nightmare_shift

# Navigate to the React app
cd nightmare-shift-react

# Install dependencies
npm install

# Start the development server
npm run dev
```

The game will be available at `http://localhost:5174` (or next available port)

### Building for Production
```bash
npm run build
npm run preview  # Preview the production build
```

### Code Quality
```bash
npm run lint     # Run TypeScript-aware ESLint
```

## 🛠️ Technology Stack

### **✅ Current (TypeScript Implementation)**
- **React 19.1** - Modern UI framework with hooks and function components
- **TypeScript 5.3** - Type-safe development with strict compiler settings
- **Vite 7.1** - Lightning-fast build tool and development server
- **Tailwind CSS 4.1** - Utility-first CSS framework for styling
- **ESLint 9.33** - Code quality with TypeScript support

### **🔧 Development Tools**
- **Strict Type Checking** - Comprehensive compile-time error detection
- **CSS Modules** - Component-scoped styling
- **Hot Module Replacement** - Instant development updates
- **Tree Shaking** - Optimized production bundles
- **Source Maps** - Enhanced debugging experience

## 📊 Project Status

### **🎯 Current State: FULLY MIGRATED TO TYPESCRIPT**
- ✅ **100% TypeScript Coverage** - All source files migrated from JS/JSX
- ✅ **Type-Safe Architecture** - Comprehensive interfaces and type definitions
- ✅ **Modern Build System** - Optimized Vite configuration
- ✅ **Clean Codebase** - Removed duplicate files and legacy code
- ✅ **Development Ready** - Running at `http://localhost:5174`

### **🔍 Migration Benefits**
- **Enhanced Developer Experience** - Full IntelliSense and error detection
- **Better Code Quality** - Self-documenting types and interfaces  
- **Reduced Runtime Errors** - Compile-time validation
- **Improved Maintainability** - Clear contracts between components
- **Future-Proof Architecture** - Modern development practices

## 🎨 Game Design Philosophy
Nightmare Shift combines psychological horror with strategic gameplay, emphasizing:
- **Atmosphere over jump scares**
- **Rule-based tension building**
- **Meaningful player choices**
- **Replayability through randomization**
- **Immersive storytelling through environmental details**

## 🎯 Victory Conditions
- **Survive** the full 8-hour shift
- **Follow all rules** without violations
- **Complete multiple rides** to maximize earnings
- **Manage resources** effectively (fuel and time)

## 💀 Failure States
- **Rule violations** result in supernatural elimination
- **Running out of fuel** with passengers leads to dire consequences
- **Time running out** can trigger bad endings
- **Poor decision-making** during passenger interactions

## 🔄 Replayability Features
- **Randomized rule sets** each shift
- **Multiple passenger combinations**
- **Different dialogue and scenarios**
- **Various ending possibilities**
- **Strategic optimization opportunities**

## 🎵 Atmosphere & Theme
The game creates tension through:
- **Dark visual design** with muted colors and shadows
- **Mysterious passenger backstories** with supernatural elements
- **Environmental storytelling** through location descriptions
- **Psychological horror** rather than explicit violence
- **Urban decay aesthetic** emphasizing isolation

---

*Can you survive the night shift? The rules are simple... breaking them is not.*