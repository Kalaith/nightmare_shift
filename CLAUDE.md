# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

Navigate to the React app directory first:
```bash
cd nightmare-shift-react
```

Essential development commands:
- `npm run dev` - Start development server (runs on localhost:5173)
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Project Architecture

**Nightmare Shift** is a horror-themed taxi driving survival game built with React, Vite, and Tailwind CSS. The project is currently transitioning from JavaScript to TypeScript (mixed .jsx and .tsx files exist).

### Key Architecture Patterns

**Game State Management**: Centralized in services with React state hooks
- `gameEngine.js` - Core game logic and rule generation
- `ruleEngine.js` - Rule validation and enforcement  
- `passengerService.js` - Passenger selection and management
- `storageService.js` - LocalStorage utilities

**Component Structure**: 
- `screens/` - Main game screens (Loading, Briefing, Game, GameOver, Success, Leaderboard)
- `game/` - Game-specific UI components (StatusBar, States, Modals)
- `common/` - Reusable UI components (Button, Modal)

**Data Layer**: Static game data in `/data`
- `gameData.js` - Rules, passengers, locations definitions
- `constants.js` - Game constants and configuration

### Game Mechanics

The game features a rule-based survival system where players follow randomized rules during 8-hour taxi shifts. Core mechanics include:
- Dynamic rule generation with difficulty scaling
- 5+ supernatural passengers with unique backstories
- Resource management (fuel, money, time)
- Multiple game states (Waiting, RideRequest, Driving, Interaction)
- Inventory system for passenger-left items

### Technology Stack

- **React 19.1** with TypeScript function components and hooks
- **TypeScript 5.3** with strict type checking
- **Vite 7.1** for build tooling and dev server
- **Tailwind CSS 4.1** for styling
- **ESLint 9.33** with TypeScript support for code quality

### File Structure & Conventions

- **Full TypeScript Migration**: All `.js/.jsx` files migrated to `.ts/.tsx`
- **Type Definitions**: Centralized in `/src/types/` directory
  - `game.ts` - Core game interfaces (GameState, Passenger, Rule, etc.)
  - `constants.ts` - Configuration type definitions
- **Components**: All React components are TypeScript with proper prop interfaces
- **Services**: Business logic classes with full type safety
- **CSS Modules**: Component-specific styling (`.module.css`)
- **Absolute imports**: Configured with `baseUrl: "./src"`

### Type Safety Features

- **Strict TypeScript configuration**: `strict: true`, `noFallthroughCasesInSwitch: true`
- **Comprehensive type coverage**: All game data, state, and components typed
- **Interface definitions** for complex game objects (Rules, Passengers, GameState)
- **Type-safe service classes** for game engine, passenger selection, and storage

### Development Notes

- **Clean Architecture**: TypeScript enables better separation of concerns
- **Reduced Runtime Errors**: Compile-time type checking prevents common bugs
- **Enhanced IDE Support**: Full IntelliSense and refactoring capabilities
- **Maintainable Codebase**: Self-documenting code through type definitions

The project maintains comprehensive game data with 20+ rules, 5+ passengers, and 6+ locations. The TypeScript migration provides better developer experience and code reliability while preserving all existing functionality.