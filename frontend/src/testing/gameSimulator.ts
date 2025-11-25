import { gameData } from '../data/gameData';
import { GAME_CONSTANTS } from '../data/constants';
import { GAME_BALANCE } from '../constants/gameBalance';
import { RouteService } from '../services/reputationService';
import type { Passenger } from '../types/game';

export type RouteChoice = 'shortcut' | 'normal' | 'scenic' | 'police';
export type Strategy = 'shortcut_spam' | 'balanced' | 'strategic' | 'perfect' | 'scenic_only' | 'random';

export interface SimulationResult {
    strategy: Strategy;
    success: boolean;
    finalEarnings: number;
    ridesCompleted: number;
    fuelRemaining: number;
    timeRemaining: number;
    gameOverReason?: string;
    routeDistribution: Record<string, number>;
    averageFarePerRide: number;
    totalFuelUsed: number;
    totalTimeUsed: number;
}

export interface SimulationStats {
    totalRuns: number;
    successRate: number;
    averageEarnings: number;
    averageRides: number;
    strategyResults: Record<Strategy, {
        runs: number;
        successes: number;
        avgEarnings: number;
        avgRides: number;
    }>;
}

export class GameSimulator {
    static simulateShift(strategy: Strategy, verbose: boolean = false): SimulationResult {
        let fuel = GAME_CONSTANTS.INITIAL_FUEL;
        let timeRemaining = GAME_CONSTANTS.INITIAL_TIME;
        let earnings = 0;
        let ridesCompleted = 0;
        const routeDistribution: Record<string, number> = {
            shortcut: 0, normal: 0, scenic: 0, police: 0
        };
        let consecutiveRouteStreak: { type: RouteChoice; count: number } | null = null;
        let gameOverReason: string | undefined;
        const REFUEL_THRESHOLD = 30; // Refuel when below 30%
        const FUEL_COST_PER_PERCENT = 0.5; // $0.50 per percent

        while (timeRemaining > 0 && fuel > 5) {
            const passenger = this.selectRandomPassenger();
            const routeChoice = this.chooseRoute(strategy, passenger, consecutiveRouteStreak);

            if (consecutiveRouteStreak?.type === routeChoice) {
                consecutiveRouteStreak.count++;
                if (routeChoice === 'shortcut' && consecutiveRouteStreak.count >= GAME_BALANCE.CONSECUTIVE_ROUTE.VIOLATION_THRESHOLD) {
                    gameOverReason = `Consecutive shortcut violation (${consecutiveRouteStreak.count} shortcuts)`;
                    break;
                }
            } else {
                consecutiveRouteStreak = { type: routeChoice, count: 1 };
            }

            const routeCosts = RouteService.calculateRouteCosts(
                routeChoice, 1, undefined, undefined, undefined, undefined, passenger
            );

            if (fuel < routeCosts.fuelCost) {
                gameOverReason = `Ran out of fuel (needed ${routeCosts.fuelCost}, had ${Math.round(fuel)})`;
                break;
            }
            if (timeRemaining < routeCosts.timeCost) {
                gameOverReason = `Ran out of time (needed ${routeCosts.timeCost}min, had ${Math.round(timeRemaining)}min)`;
                break;
            }

            fuel -= routeCosts.fuelCost;
            timeRemaining -= routeCosts.timeCost;
            const fare = this.calculateFare(passenger, routeChoice, consecutiveRouteStreak.count);
            earnings += fare;
            ridesCompleted++;
            routeDistribution[routeChoice]++;

            // Auto-refuel when fuel drops below threshold
            if (fuel < REFUEL_THRESHOLD) {
                const fuelNeeded = 100 - fuel;
                const refuelCost = Math.ceil(fuelNeeded * FUEL_COST_PER_PERCENT);

                if (earnings >= refuelCost) {
                    earnings -= refuelCost;
                    fuel = 100;
                } else {
                    // Can't afford to refuel, continue with low fuel
                    // Will likely run out soon
                }
            }
        }

        const success = !gameOverReason && earnings >= GAME_CONSTANTS.MINIMUM_EARNINGS;

        if (!success && verbose) {
            console.log(`\n${strategy} FAILED:`);
            console.log(`  Rides: ${ridesCompleted}, Earnings: $${Math.round(earnings)}`);
            console.log(`  Fuel: ${Math.round(fuel)}, Time: ${Math.round(timeRemaining)}min`);
            if (gameOverReason) console.log(`  Reason: ${gameOverReason}`);
            else console.log(`  Reason: Insufficient earnings ($${Math.round(earnings)} < $${GAME_CONSTANTS.MINIMUM_EARNINGS})`);
        }

        return {
            strategy, success,
            finalEarnings: Math.round(earnings), ridesCompleted, fuelRemaining: fuel, timeRemaining,
            gameOverReason, routeDistribution,
            averageFarePerRide: ridesCompleted > 0 ? earnings / ridesCompleted : 0,
            totalFuelUsed: GAME_CONSTANTS.INITIAL_FUEL - fuel,
            totalTimeUsed: GAME_CONSTANTS.INITIAL_TIME - timeRemaining
        };
    }

    private static selectRandomPassenger(): Passenger {
        return gameData.passengers[Math.floor(Math.random() * gameData.passengers.length)];
    }

    private static chooseRoute(strategy: Strategy, passenger: Passenger, streak: { type: RouteChoice; count: number } | null): RouteChoice {
        const routes: RouteChoice[] = ['shortcut', 'normal', 'scenic', 'police'];

        switch (strategy) {
            case 'shortcut_spam': return 'shortcut';
            case 'scenic_only': return 'scenic';
            case 'random': return routes[Math.floor(Math.random() * routes.length)];

            case 'balanced':
                if (streak && streak.count >= 2) {
                    const alts = routes.filter(r => r !== streak.type);
                    return alts[Math.floor(Math.random() * alts.length)];
                }
                return 'normal';

            case 'strategic': {
                const prefs = passenger.routePreferences;
                if (!prefs || prefs.length === 0) return 'normal';

                const feared = prefs.find(p => p.preference === 'fears');
                const disliked = prefs.find(p => p.preference === 'dislikes');
                const avoided = [feared?.route, disliked?.route].filter((r): r is RouteChoice => r !== undefined);

                const loved = prefs.find(p => p.preference === 'loves' && !avoided.includes(p.route as RouteChoice));
                if (loved) return loved.route as RouteChoice;

                const liked = prefs.find(p => p.preference === 'likes' && !avoided.includes(p.route as RouteChoice));
                if (liked) return liked.route as RouteChoice;

                if (avoided.length > 0) {
                    const alts = routes.filter(r => !avoided.includes(r));
                    if (alts.length > 0) return alts[Math.floor(Math.random() * alts.length)];
                }
                return 'normal';
            }

            case 'perfect': {
                const prefs = passenger.routePreferences;
                if (!prefs || prefs.length === 0) return 'normal';

                let bestRoute: RouteChoice = 'normal';
                let bestScore = 0;

                // Get fuel costs for each route type
                const fuelCosts = {
                    shortcut: 5,
                    normal: 9,
                    scenic: 15,
                    police: 12
                };

                for (const pref of prefs) {
                    const route = pref.route as RouteChoice;
                    const routeMult = route === 'shortcut' ? 0.85 : route === 'scenic' ? 1.25 : route === 'police' ? 1.05 : 1.0;
                    const passengerMult = pref.fareModifier || 1.0;
                    const fareMultiplier = routeMult * passengerMult;

                    // Calculate profit per fuel: (fare multiplier) / (fuel cost)
                    // This ensures we choose routes that are both profitable AND fuel-efficient
                    const fuelCost = fuelCosts[route];
                    const score = fareMultiplier / fuelCost;

                    if (score > bestScore) {
                        bestScore = score;
                        bestRoute = route;
                    }
                }
                return bestRoute;
            }

            default: return 'normal';
        }
    }

    private static calculateFare(passenger: Passenger, routeChoice: RouteChoice, consecutiveCount: number): number {
        let routeMultiplier = 1.0;
        switch (routeChoice) {
            case 'shortcut': routeMultiplier = GAME_BALANCE.ROUTE_FARE_MULTIPLIERS.SHORTCUT; break;
            case 'scenic': routeMultiplier = GAME_BALANCE.ROUTE_FARE_MULTIPLIERS.SCENIC; break;
            case 'police': routeMultiplier = GAME_BALANCE.ROUTE_FARE_MULTIPLIERS.POLICE; break;
            case 'normal': routeMultiplier = GAME_BALANCE.ROUTE_FARE_MULTIPLIERS.NORMAL; break;
        }

        if (consecutiveCount >= 2) {
            const penalty = (consecutiveCount - 1) * GAME_BALANCE.CONSECUTIVE_ROUTE.PENALTY_PER_REPEAT;
            routeMultiplier *= (1 - penalty);
        }

        const preference = passenger.routePreferences?.find(p => p.route === routeChoice);
        const passengerModifier = preference?.fareModifier || 1.0;
        const fare = passenger.fare * routeMultiplier * passengerModifier;

        return Math.max(5, Math.round(fare));
    }

    static printReport(stats: SimulationStats): void {
        console.log('\n' + '='.repeat(80));
        console.log('📊 NIGHTMARE SHIFT - BALANCE TEST REPORT');
        console.log('='.repeat(80));
        console.log(`\nTotal Simulations: ${stats.totalRuns}`);
        console.log(`Overall Success Rate: ${stats.successRate.toFixed(1)}%`);
        console.log(`Average Earnings: $${stats.averageEarnings}`);
        console.log(`Average Rides: ${stats.averageRides}`);
        console.log(`Minimum Required: $${GAME_CONSTANTS.MINIMUM_EARNINGS}`);

        console.log('\n' + '-'.repeat(80));
        console.log('STRATEGY BREAKDOWN');
        console.log('-'.repeat(80));

        Object.entries(stats.strategyResults).forEach(([strategy, result]) => {
            if (result.runs > 0) {
                const successRate = (result.successes / result.runs) * 100;
                const avgFarePerRide = result.avgRides > 0 ? Math.round(result.avgEarnings / result.avgRides) : 0;
                console.log(`\n${strategy.toUpperCase().replace('_', ' ')}:`);
                console.log(`  Runs: ${result.runs}`);
                console.log(`  Success Rate: ${successRate.toFixed(1)}%`);
                console.log(`  Avg Earnings: $${result.avgEarnings}`);
                console.log(`  Avg Rides: ${result.avgRides}`);
                console.log(`  Avg Fare/Ride: $${avgFarePerRide}`);
                console.log(`  ${result.avgEarnings >= GAME_CONSTANTS.MINIMUM_EARNINGS ? '✅ PASS' : '❌ FAIL'}`);
            }
        });

        console.log('\n' + '='.repeat(80));
        console.log('ROUTE ECONOMICS');
        console.log('='.repeat(80));

        console.log('\nBase Costs (no modifiers):');
        console.log(`  Shortcut: ${GAME_CONSTANTS.FUEL_COST_SHORTCUT}f, ${GAME_CONSTANTS.TIME_COST_SHORTCUT}m → 0.85x fare`);
        console.log(`  Normal:   ${GAME_CONSTANTS.FUEL_COST_NORMAL}f, ${GAME_CONSTANTS.TIME_COST_NORMAL}m → 1.0x fare`);
        console.log(`  Scenic:   ${GAME_CONSTANTS.FUEL_COST_SCENIC}f, ${GAME_CONSTANTS.TIME_COST_SCENIC}m → 1.25x fare`);
        console.log(`  Police:   ${GAME_CONSTANTS.FUEL_COST_POLICE}f, ${GAME_CONSTANTS.TIME_COST_POLICE}m → 1.05x fare`);

        console.log('\n' + '='.repeat(80));
        console.log('BALANCE ANALYSIS');
        console.log('='.repeat(80));

        const perfect = stats.strategyResults.perfect;
        const strategic = stats.strategyResults.strategic;
        const shortcut = stats.strategyResults.shortcut_spam;
        const scenic = stats.strategyResults.scenic_only;

        if (perfect && strategic && shortcut && scenic) {
            console.log(`\n✓ Perfect: ${(perfect.successes / perfect.runs * 100).toFixed(1)}%`);
            console.log(`✓ Strategic: ${(strategic.successes / strategic.runs * 100).toFixed(1)}%`);
            console.log(`✓ Shortcut spam: ${(shortcut.successes / shortcut.runs * 100).toFixed(1)}%`);
            console.log(`✓ Scenic only: ${(scenic.successes / scenic.runs * 100).toFixed(1)}%`);

            if (strategic.successes / strategic.runs >= 0.75) {
                console.log('\n✅ BALANCE GOOD: Strategic play is highly successful (75%+)');
            } else {
                console.log('\n⚠️  BALANCE ISSUE: Strategic play should be 75%+ successful');
            }

            if (shortcut.successes / shortcut.runs <= 0.1) {
                console.log('✅ BALANCE GOOD: Shortcut spam is not viable');
            } else {
                console.log('⚠️  BALANCE ISSUE: Shortcut spam too successful');
            }
        }

        console.log('\n' + '='.repeat(80) + '\n');
    }
}
