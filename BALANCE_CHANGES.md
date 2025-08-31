# Game Balance Fixes - Shift Duration Issue

## Problem Identified
Players were experiencing premature shift termination after only 2 rides, earning ~$70 but needing $120 to pass. This created a frustrating experience where shifts ended too early despite having time and resources remaining.

## Root Cause Analysis

### Original Balance Issues:
1. **Fuel Termination Threshold Too High**: 15% fuel threshold meant only 85% usable fuel
2. **Inconsistent Fuel Checks**: Multiple different fuel thresholds (5, 15, 20) across codebase
3. **Minimum Earnings Too High**: $120 requirement with only 2-4 possible rides
4. **Early Game Over Conditions**: Multiple fuel checks that ended game prematurely

### Economic Math:
- **Starting fuel**: 100%
- **Route fuel costs**: 15-25% per ride (average ~20%)
- **Old threshold**: 15% → Only 4-5 rides possible maximum
- **Passenger fares**: $12-$100 (average ~$30)
- **Refuel costs**: $0.50 per fuel point
- **Net profit per ride**: ~$20 after fuel costs

## Implemented Fixes

### 1. Consistent Fuel Thresholds
**Files Changed:**
- `src/hooks/useGameActions.ts` line 27: `fuel < 20` → `fuel < 5`
- `src/hooks/useGameActions.ts` line 314: `fuel <= 15` → `fuel <= 5`  
- `src/components/game/TensionMeter/TensionMeter.tsx` line 134: `fuel < 20` → `fuel < 10`
- `src/constants/gameBalance.ts` line 18: `FUEL_CHECK_MINIMUM: 20` → `FUEL_CHECK_MINIMUM: 5`

### 2. Reduced Minimum Earnings
**Files Changed:**
- `src/data/constants.ts` line 16: `MINIMUM_EARNINGS: 120` → `MINIMUM_EARNINGS: 80`

## Expected Impact

### New Balance Projection:
- **Usable fuel**: 95% (100% - 5% threshold)
- **Possible rides**: 5-6 rides (95% ÷ 18% average fuel cost)
- **Expected earnings**: 6 rides × $20 net profit = $120
- **New minimum**: $80 (achievable with 4+ rides)
- **Safety margin**: Players can now complete more rides and still pass with earnings to spare

### Player Experience Improvements:
1. **Longer shifts**: Players can complete 5-6 rides instead of 2-3
2. **Strategic refueling**: More opportunities to refuel and extend shifts
3. **Achievable targets**: $80 minimum is realistic with 4+ completed rides
4. **Consistent mechanics**: All fuel thresholds now aligned and predictable

## Validation Checklist
- [x] Build compiles successfully with no TypeScript errors
- [x] Fuel threshold consistency across all components
- [x] Minimum earnings aligned with expected ride count
- [x] No conflicting early termination conditions
- [ ] Playtesting to confirm 5-6 ride shifts are achievable
- [ ] Player feedback on improved balance

## Balance Constants Summary

| Constant | Old Value | New Value | Purpose |
|----------|-----------|-----------|---------|
| `MINIMUM_EARNINGS` | $120 | $80 | Shift success threshold |
| Accept ride fuel check | < 20% | < 5% | Immediate game over condition |
| Shift end fuel check | ≤ 15% | ≤ 5% | Natural shift termination |
| Tension meter fuel stress | < 20% | < 10% | Psychological pressure indicator |
| `FUEL_CHECK_MINIMUM` | 20% | 5% | Balance constant alignment |

This fix should resolve the "shift ended after 2 rides" issue while maintaining game challenge and economic balance.