# Frontend Code Review Report
**Project:** Nightmare Shift  
**Date:** 2025-11-26  
**Reviewer:** Antigravity (Agentic AI)

---

## 1. Executive Summary

The codebase demonstrates a functional React application with a strong foundation in TypeScript. The type definitions are robust, and the project runs in strict mode, which is excellent. However, the architecture suffers from significant scalability issues due to a "God Object" pattern in state management and a lack of separation between UI and business logic.

The current structure relies heavily on a single `useApp` hook that aggregates all state and logic, which is then drilled down through a manual `ScreenRouter`. This makes components difficult to test and reuse. Additionally, the lack of a component library (e.g., reusable Button, Card) has led to code duplication and inconsistent styling.

**Top Priority:** Refactor the state management to use React Context or a lightweight store (Zustand) to eliminate prop drilling, and extract business logic from hooks/components into pure services.

---

## 2. Critical Issues

### 2.1. "God Object" State Management & Prop Drilling
**Location:** `src/hooks/useApp.ts`, `src/components/ScreenRouter.tsx`
- **Issue:** `useApp` aggregates `usePlayerStats`, `useGameState`, and `useGameActions`, creating a massive `screenProps` object. This object is passed to `ScreenRouter`, which then passes *everything* to every screen.
- **Impact:** Any state change triggers a re-render of the entire app tree. Adding a new feature requires updating `useApp`, `ScreenRouter`, and the specific screen, making development slow and error-prone.
- **Recommendation:** Switch to **React Context** or **Zustand**. Split state into `GameContext`, `PlayerContext`, and `UIContext`.

### 2.2. Business Logic Leaking into UI
**Location:** `src/components/screens/GameScreen/GameScreen.tsx`
- **Issue:** The render function contains heavy logic, such as calculating `routeOptions` (lines 183-195) and generating fallback routes (lines 199-213).
- **Impact:** This violates the "Components handle UI only" principle. It makes the component hard to read and impossible to unit test without rendering.
- **Recommendation:** Move this logic into a `useRouteOptions` hook or a pure selector function in `RouteService`.

### 2.3. "Action God Hook"
**Location:** `src/hooks/useGameActions.ts`
- **Issue:** This hook contains core business logic for the entire game loop, including fare calculation, rule evaluation, and item drops. It is over 450 lines long.
- **Impact:** It mixes state updates with complex business rules, making it a "black box" that is hard to debug.
- **Recommendation:** Extract logic into pure service functions (e.g., `FareCalculator.calculate(passenger, route)`). The hook should only call these services and update state.

---

## 3. Major Issues

### 3.1. Lack of Reusable UI Components
**Location:** Throughout `src/components/screens/`
- **Issue:** There is no reusable `Button`, `Card`, or `Badge` component. Raw HTML elements (`<button>`, `<div>`) are used with repeated Tailwind classes.
- **Example:** `GameScreen.tsx` has 5+ different buttons with similar `bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded` classes.
- **Impact:** Inconsistent UI and massive code duplication. Changing the primary button color would require finding/replacing hundreds of instances.
- **Recommendation:** Create `src/components/common/Button.tsx`, `Card.tsx`, etc.

### 3.2. Tailwind "Class Nightmares"
**Location:** `src/components/screens/GameScreen/GameScreen.tsx` (lines 267-308)
- **Issue:** Extremely complex inline conditional logic for class names.
- **Example:** Nested ternary operators determining background colors based on `riskLevel`, `route.type`, and `passengerReaction`.
- **Impact:** Unreadable code. Very easy to break styling when modifying conditions.
- **Recommendation:** Use a utility like `clsx` or `cva` (Class Variance Authority) to manage complex variants, or extract logic to a helper function `getRouteStyles(route)`.

### 3.3. Missing Project Directories
**Location:** `src/`
- **Issue:** Missing `features/`, `pages/`, `config/`, and `state/` directories as requested.
- **Impact:** "Screens" are mixed with "Components". Feature-specific logic is scattered.
- **Recommendation:**
    - Move `components/screens` -> `src/pages`
    - Create `src/features/game` and move `GameScreen` logic there.
    - Create `src/config` for constants.

---

## 4. Minor Issues

### 4.1. Inline Helper Functions
**Location:** `GameScreen.tsx` (`formatTime`, `handleEndShiftEarly`)
- **Issue:** Helper functions defined inside the component scope.
- **Impact:** Recreated on every render. Clutters the component body.
- **Recommendation:** Move `formatTime` to `src/utils/formatters.ts`.

### 4.2. Hardcoded Strings
**Location:** `useGameActions.ts`
- **Issue:** Game over messages and UI text are hardcoded strings.
- **Impact:** Hard to maintain or localize.
- **Recommendation:** Move to `src/data/strings.ts` or `src/config/messages.ts`.

### 4.3. Manual Routing
**Location:** `ScreenRouter.tsx`
- **Issue:** A giant `switch` statement handles routing.
- **Impact:** Not scalable.
- **Recommendation:** While `react-router` might be overkill for a game, a config-based router (mapping constants to components) would be cleaner.

---

## 5. Suggestions / Improvements

1.  **Adopt `clsx` and `tailwind-merge`**: Essential for building reusable components that accept `className` props without conflicts.
2.  **Use React Context for Theme/Config**: Instead of passing `showInventory` everywhere, put it in a `UIContext`.
3.  **Barrel Files**: You are using them in `types/`, which is good. Extend this to `components/` and `hooks/` for cleaner imports.
4.  **Performance**: Wrap `GameScreen` content in `React.memo` if re-renders become an issue, though fixing the "God Object" state is the real fix.

---

## 6. Scores

| Category | Score | Notes |
| :--- | :---: | :--- |
| **Architecture** | **4/10** | "God Object" pattern and prop drilling are major limiting factors. |
| **Code Quality** | **6/10** | Code is readable but suffers from duplication and lack of abstraction. |
| **TypeScript Safety** | **9/10** | Excellent. Strict mode, no `any`, well-defined interfaces. |
| **UI/UX Quality** | **6/10** | Functional, but implementation is messy (inline styles) and lacks a design system. |

---

## 7. Overall Recommendation

**Status: NEEDS REFACTORING**

The project has a solid functional core and excellent type safety, but the architectural decisions (state management and component structure) will severely hamper future development.

**Immediate Action Plan:**
1.  **Refactor State**: Introduce a proper state manager (Context or Zustand) to break the `useApp` dependency chain.
2.  **Create UI Kit**: Build base `Button`, `Card`, and `Container` components to clean up the UI code.
3.  **Clean GameScreen**: Extract the route calculation logic into a custom hook `useRouteCalculation`.
