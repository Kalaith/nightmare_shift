# Automated Balance Testing System

## Overview

The automated testing system runs hundreds of game simulations to validate balance changes and identify issues before release.

## Quick Start

```bash
npm run test:balance
```

This will run 100 simulations across 5 different strategies and display:
- ✅ Real-time progress bar
- 📊 Live success rates per strategy  
- ⚡ Performance metrics
- 📈 Detailed balance analysis

## What It Tests

### Strategies Tested

1. **Shortcut Spam** - Takes shortcuts every time (should fail with new balance)
2. **Balanced** - Rotates routes to avoid penalties
3. **Strategic** - Chooses routes based on passenger preferences
4. **Scenic Only** - Always takes scenic routes
5. **Random** - Random route selection

### Metrics Collected

- Success rate (% of shifts that meet minimum earnings)
- Average earnings per shift
- Average rides completed
- Route distribution
- Fuel/time efficiency

## Visual Output

The test runner provides rich visual feedback:

```
╔════════════════════════════════════════════════════════════════════════════╗
║                            🚗 NIGHTMARE SHIFT                              ║
║                       Automated Balance Testing                            ║
╚════════════════════════════════════════════════════════════════════════════╝

📋 Configuration:
   Total Simulations: 100
   Strategies: 5 (shortcut_spam, balanced, strategic, scenic_only, random)
   Runs per strategy: 20

🎮 Starting simulations...

Progress:
  [██████████████████████████████░░░░░░░░░░░░░░░░░░░░] 60% (60/100)

Strategy Status:
  ✓ SHORTCUT SPAM       12 runs, 25.0% success
  ✓ BALANCED            12 runs, 75.0% success
  ✓ STRATEGIC           12 runs, 91.7% success
  ✗ SCENIC ONLY         12 runs, 41.7% success
  ✓ RANDOM              12 runs, 58.3% success
```

## Expected Results

### Good Balance Indicators

✅ **Shortcut spam** should have <50% success rate and <$120 avg earnings
✅ **Strategic play** should have >70% success rate and >$130 avg earnings  
✅ **Balanced approach** should have ~60-70% success rate

### Balance Issues

⚠️ If shortcut spam succeeds >50% of the time, shortcuts are still too profitable
⚠️ If strategic play succeeds <60% of the time, the game may be too difficult

## Customization

Edit `src/testing/runBalanceTests.ts` to adjust:

```typescript
const TOTAL_RUNS = 100;  // Number of simulations
const STRATEGIES: Strategy[] = [  // Which strategies to test
  'shortcut_spam',
  'strategic',
  // ... add or remove strategies
];
```

## Technical Details

### Game Simulator (`gameSimulator.ts`)

- Simulates full 8-hour shifts
- Applies all balance rules (fare multipliers, penalties, etc.)
- Tracks resource usage (fuel, time)
- Calculates earnings with passenger preferences

### Test Runner (`runBalanceTests.ts`)

- Runs simulations in batches
- Updates progress in real-time
- Collects and aggregates statistics
- Generates detailed reports

## Interpreting Results

The final report shows:

1. **Overall Statistics** - Success rate across all strategies
2. **Strategy Breakdown** - Performance of each approach
3. **Balance Analysis** - Automated assessment of game balance

Look for:
- Strategic play should be most rewarding
- Shortcut spam should fail consistently
- Balanced approaches should be viable but not optimal

## Troubleshooting

**Tests run too slowly:**
- Reduce `TOTAL_RUNS` to 50 or 25 for faster testing
- Remove strategies you don't need to test

**Results seem wrong:**
- Check that balance constants in `gameBalance.ts` are correct
- Verify fare calculation in `useGameActions.ts`
- Review route cost calculation in `reputationService.ts`

## Integration with Development

Run tests after making balance changes:

```bash
# Make balance changes
npm run test:balance  # Verify changes
npm run build         # Build if tests pass
npm run dev          # Manual testing
```
