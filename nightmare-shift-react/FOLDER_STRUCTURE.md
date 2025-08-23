# Refactored Folder Structure

```
src/
├── components/                 # Reusable UI components
│   ├── common/                # Generic reusable components
│   │   ├── Button/
│   │   │   ├── Button.jsx
│   │   │   └── Button.module.css
│   │   └── Modal/
│   │       ├── Modal.jsx
│   │       └── Modal.module.css
│   ├── game/                  # Game-specific components
│   │   ├── StatusBar/
│   │   │   ├── StatusBar.jsx
│   │   │   └── StatusBar.module.css
│   │   ├── PassengerCard/
│   │   │   ├── PassengerCard.jsx
│   │   │   └── PassengerCard.module.css
│   │   ├── RuleCard/
│   │   │   ├── RuleCard.jsx
│   │   │   └── RuleCard.module.css
│   │   └── InventoryModal/
│   │       ├── InventoryModal.jsx
│   │       └── InventoryModal.module.css
│   └── screens/               # Screen/Page components
│       ├── LoadingScreen/
│       │   ├── LoadingScreen.jsx
│       │   └── LoadingScreen.module.css
│       ├── LeaderboardScreen/
│       │   ├── LeaderboardScreen.jsx
│       │   └── LeaderboardScreen.module.css
│       ├── BriefingScreen/
│       │   ├── BriefingScreen.jsx
│       │   └── BriefingScreen.module.css
│       ├── GameScreen/
│       │   ├── GameScreen.jsx
│       │   └── GameScreen.module.css
│       ├── GameOverScreen/
│       │   ├── GameOverScreen.jsx
│       │   └── GameOverScreen.module.css
│       └── SuccessScreen/
│           ├── SuccessScreen.jsx
│           └── SuccessScreen.module.css
├── hooks/                     # Custom React hooks
│   ├── useLocalStorage.js
│   ├── useGameState.js
│   ├── useLeaderboard.js
│   └── useGameLogic.js
├── services/                  # Business logic and external services
│   ├── gameEngine.js         # Core game logic
│   ├── ruleEngine.js         # Rule system logic
│   ├── passengerService.js   # Passenger selection and management
│   └── storageService.js     # LocalStorage utilities
├── data/                     # Static game data
│   ├── gameData.js          # All game data (rules, passengers, locations)
│   └── constants.js         # Game constants and enums
├── utils/                    # Pure utility functions
│   ├── formatters.js        # Time, currency formatting
│   ├── gameHelpers.js       # Game utility functions
│   └── validators.js        # Input validation
├── styles/                   # Global styles
│   ├── globals.css          # Global CSS variables and resets
│   ├── variables.css        # CSS custom properties
│   └── themes.css           # Theme definitions
├── types/                    # TypeScript type definitions (if using TS)
│   ├── game.ts
│   ├── passenger.ts
│   └── rule.ts
├── App.jsx                   # Main application orchestrator
├── App.module.css           # App-specific styles
└── main.jsx                 # Entry point
```

## Rationale for Structure:

1. **components/**: Organized by scope (common, game-specific, screens)
2. **hooks/**: Custom hooks for reusable stateful logic
3. **services/**: Business logic separated from UI components
4. **data/**: Static game data in structured format
5. **utils/**: Pure functions for common operations
6. **styles/**: Centralized styling with CSS modules for component-specific styles