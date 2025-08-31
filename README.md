# 🚗 Nightmare Shift

A horror-themed taxi driving survival game built with React, TypeScript, and modern web technologies. Navigate the dark streets as a night shift taxi driver while following mysterious rules and managing supernatural encounters to survive until dawn.

## 🎮 Game Overview

You play as a night shift taxi driver in a supernatural world where breaking the rules can mean more than just losing your job. Each shift presents you with mysterious rules to follow while picking up increasingly disturbing passengers, managing resources, and making strategic decisions that determine your survival.

## ✨ Game Features

### 🌟 Core Gameplay
- **Advanced Rule System**: 14 sophisticated rules with conditional logic, conflicts, and hidden mechanics
- **Expanded Passenger Pool**: Encounter 16 unique supernatural passengers with deep backstories and interconnected relationships  
- **Dynamic Weather System**: 6 weather types with 3 intensity levels affecting gameplay and route costs
- **Resource Management**: Complex fuel, money, and time systems with strategic refueling decisions
- **Choice-Driven Narrative**: Meaningful decisions with lasting consequences across multiple shifts

### 📋 Advanced Rules System
**14 Total Rules** with dynamic selection based on conditions:
- **Basic Rules**: Core survival mechanics (No Eye Contact, Silent Night, Cash Only, etc.)
- **Conditional Rules**: Activate only under specific circumstances (weather, passenger types)
- **Conflicting Rules**: Sometimes rules contradict each other, forcing strategic choices
- **Hidden Rules**: Revealed only when violated, creating suspenseful gameplay
- **Weather-Triggered**: 6 additional rules activated by environmental conditions
- **Rule Modifications**: Passengers can change active rules mid-shift

### 👻 Supernatural Passengers
**16 Unique Characters** across multiple rarity tiers:
- **Common Encounters**: Everyday people with hidden supernatural aspects
- **Rare Passengers**: More dangerous entities with complex backstories
- **Legendary Passengers**: Ultra-rare encounters like The Midnight Mayor and Death's Taxi Driver
- **Interconnected Stories**: Passengers reference each other and past encounters
- **Backstory Unlocks**: Discover deep lore through repeated interactions
- **Relationship Networks**: Some passengers know each other, affecting future rides

### 🌍 Rich Game World
**24 Detailed Locations** with atmospheric descriptions:
- **Urban Areas**: Downtown apartments, office districts, shopping centers
- **Supernatural Sites**: Abandoned hospital, riverside cemetery, haunted theater
- **Industrial Zones**: Warehouses, shipping docks, factory districts  
- **Natural Areas**: Forest roads, lakeside paths, mountain routes
- **Each Location Features**: Risk levels, environmental storytelling, weather interactions

### 🎯 Advanced Game Mechanics

#### 🌤️ **Dynamic Weather System**
- **6 Weather Types**: Clear, Rain, Fog, Snow, Thunderstorm, Wind
- **3 Intensity Levels**: Light, Moderate, Heavy conditions
- **Seasonal Changes**: 4 seasons affecting passenger spawns and weather patterns
- **Weather Effects**: Visibility reduction, fuel consumption changes, time delays
- **Environmental Hazards**: 5 hazard types that block routes and modify costs

#### 🎒 **Advanced Inventory & Items**
- **20+ Unique Items** with different properties and rarities
- **Item Interactions**: Use collected objects to solve supernatural problems
- **Cursed Objects**: Negative effects if kept too long
- **Protective Charms**: Items that help avoid supernatural consequences  
- **Item Trading**: Exchange items with passengers or at special locations
- **Item Deterioration**: Objects change or disappear over time

#### ⛽ **Comprehensive Fuel Management**
- **Strategic Refueling**: Full tank vs partial refueling options during waiting
- **Dynamic Costs**: Weather and hazards affect fuel consumption
- **Critical Warnings**: Visual and audio alerts for dangerous fuel levels
- **Economic Pressure**: Balance fuel costs against minimum earnings requirements

#### 🎬 **Enhanced Ride Experience**
- **Drop-Off Screens**: Detailed ride completion with passenger feedback and service ratings
- **Item Discovery**: See exactly what items you received with full descriptions
- **Backstory Revelations**: Immersive lore unlock notifications
- **Smooth Transitions**: No more abrupt jumps between game phases

### 💀 Enhanced Survival Elements
- **Adaptive Difficulty**: Safe play leads to boring, low-paying passengers
- **Economic Pressure**: Minimum earnings requirement to pass shifts
- **Fuel/Time Constraints**: Dangerous routes vs resource efficiency decisions
- **Passenger Memory**: Characters remember and react to previous interactions
- **Dynamic Rule Conflicts**: Unavoidable situations where rules must be broken
- **Reputation System**: Player choices affect future passenger encounters

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

### **✅ Modern Architecture**
- **React 19.1** - Modern UI framework with hooks and function components
- **TypeScript 5.3** - Type-safe development with strict compiler settings  
- **Vite 7.1** - Lightning-fast build tool and development server
- **Tailwind CSS 4.1** - Utility-first CSS framework for styling
- **ESLint 9.33** - Code quality with TypeScript support

### **🏗️ Architecture Patterns**
- **Service-Oriented Design**: WeatherService, ItemService, PassengerService, ReputationService
- **Type-Safe Game State**: Comprehensive interfaces for all game entities
- **Component-Based UI**: Modular React components with CSS Modules
- **Error Handling**: GameResult wrapper pattern for robust error management
- **Hook-Based State**: Custom hooks for game logic separation

### **🔧 Development Tools**
- **Strict Type Checking** - Comprehensive compile-time error detection
- **CSS Modules** - Component-scoped styling prevents style conflicts
- **Hot Module Replacement** - Instant development updates
- **Tree Shaking** - Optimized production bundles  
- **Source Maps** - Enhanced debugging experience

## 📊 Project Status

### **🎯 Current State: FEATURE-COMPLETE GAME**
- ✅ **100% TypeScript Coverage** - All source files migrated from JS/JSX
- ✅ **Advanced Game Systems** - Weather, inventory, reputation, and passenger relationship systems
- ✅ **Enhanced User Experience** - Drop-off screens, fuel management, smooth transitions
- ✅ **Modern Build System** - Optimized Vite configuration with production builds
- ✅ **Production Ready** - Fully functional game with comprehensive features

### **📈 Implementation Status**
**✅ FULLY COMPLETED (8/8 major features):**
- Gameplay Risk/Reward Balance
- Expanded Passenger Pool (16 characters)
- Advanced Rule System (14 rules with conditional logic)
- Immersion Features (24 locations, rich atmosphere)
- Advanced Inventory & Items System (20+ items)
- Weather & Environmental Effects (6 weather types, 5 hazards)
- Enhanced UI/UX (modern React, drop-off screens, fuel management)
- Multiple Endings & Story Paths (reputation system, passenger relationships)

### **🚀 Recent Major Updates**
- **Drop-Off Screens**: Rich ride completion experience with item discovery and lore
- **Fuel Management System**: Strategic refueling with full/partial options
- **Weather Integration**: Dynamic weather affecting gameplay and atmosphere  
- **Enhanced Inventory**: Advanced item system with trading, curses, and protective properties

## 🎨 Game Design Philosophy
Nightmare Shift combines psychological horror with strategic gameplay, emphasizing:
- **Atmosphere over jump scares** - Building dread through environmental storytelling
- **Risk/Reward Decision Making** - Dangerous routes vs resource efficiency
- **Emergent Storytelling** - Passenger relationships and interconnected narratives  
- **Strategic Resource Management** - Fuel, time, and money create meaningful constraints
- **Adaptive Challenge** - Game responds to player behavior with dynamic difficulty
- **Immersive World Building** - Weather, locations, and lore create a living supernatural world

## 🎯 Victory & Challenge Systems

### **🏆 Success Conditions**
- **Survive** the full 8-hour shift while following dynamic rules
- **Earn minimum required income** ($120) through strategic ride selection
- **Manage fuel efficiently** to avoid running out during critical moments
- **Navigate passenger relationships** and unlock valuable backstories
- **Adapt to weather conditions** and environmental hazards

### **💀 Failure States & Consequences** 
- **Rule violations** trigger immediate supernatural consequences
- **Fuel depletion** with passengers leads to dire outcomes
- **Economic failure** from not meeting minimum earnings
- **Passenger relationship failures** affect future encounter difficulty
- **Weather hazard mismanagement** can block routes and waste resources

### **🔄 Enhanced Replayability**
- **Complex Rule Interactions**: 14 rules with conditional logic create unique scenarios
- **Weather Variability**: 6 weather types x 3 intensities x 4 seasons = 72 combinations
- **Passenger Network Effects**: Reputation system affects future passenger availability
- **Item Collection Paths**: 20+ items with different acquisition and trading strategies
- **Backstory Discovery**: Deep lore unlocked through repeated character interactions
- **Strategic Optimization**: Multiple valid approaches to resource management

## 🌙 Immersive Atmosphere & Design

### **🎨 Visual & Audio Design**
- **Dark Urban Aesthetic**: Muted colors, shadows, and flickering streetlights
- **Weather Integration**: Visual effects for rain, fog, snow, and storms
- **Dynamic UI Elements**: Fuel bars, weather displays, and status indicators
- **Atmospheric Location Art**: Rich descriptions create mental imagery
- **Tension Through Interface**: Critical warnings and ominous notifications

### **📖 Narrative Design**
- **Environmental Storytelling**: Each of 24 locations tells a story
- **Interconnected Character Arcs**: Passengers reference each other and past events  
- **Layered Mystery**: Multiple supernatural elements revealed through gameplay
- **Emergent Horror**: Player choices create unique scary situations
- **Psychological Dread**: Building anxiety through uncertainty rather than explicit horror

### **🎭 Gameplay Integration**
- **Rules Create Atmosphere**: Supernatural restrictions feel genuinely threatening
- **Resource Scarcity Tension**: Fuel and time management create constant pressure  
- **Weather Affects Mood**: Environmental conditions change game feel
- **Item Discovery**: Mysterious objects found after rides build supernatural lore

---

## 🎮 **Ready to Drive?**

*The city's dark streets await. Your shift starts now.*  
*Remember: The rules exist for a reason. Breaking them... has consequences.*

**Can you survive until dawn?**