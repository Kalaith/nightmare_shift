/* eslint-env node */
import { GameSimulator, type Strategy } from './gameSimulator';
import * as fs from 'fs';

const TOTAL_RUNS = 120;
const STRATEGIES: Strategy[] = [
  'shortcut_spam',
  'balanced',
  'strategic',
  'perfect',
  'scenic_only',
  'random',
];

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bgGreen: '\x1b[42m',
};

function printHeader() {
  console.clear();
  console.log(
    colors.cyan +
      colors.bright +
      '\n╔════════════════════════════════════════════════════════════════════════════╗'
  );
  console.log('║' + ' '.repeat(28) + '🚗 NIGHTMARE SHIFT' + ' '.repeat(28) + '║');
  console.log('║' + ' '.repeat(23) + 'Automated Balance Testing' + ' '.repeat(23) + '║');
  console.log(
    '╚════════════════════════════════════════════════════════════════════════════╝' +
      colors.reset +
      '\n'
  );
}

function printProgressBar(current: number, total: number, width: number = 50): string {
  const percentage = Math.floor((current / total) * 100);
  const filled = Math.floor((current / total) * width);
  const bar =
    colors.bgGreen +
    ' '.repeat(filled) +
    colors.reset +
    colors.dim +
    '░'.repeat(width - filled) +
    colors.reset;
  return `[${bar}] ${percentage}% (${current}/${total})`;
}

function printStrategyStatus(strategy: Strategy, runs: number, successes: number) {
  const rate = runs > 0 ? ((successes / runs) * 100).toFixed(1) : '0.0';
  const icon = parseFloat(rate) >= 50 ? '✓' : '✗';
  const color = parseFloat(rate) >= 50 ? colors.green : colors.red;
  console.log(
    `  ${color}${icon}${colors.reset} ${strategy.replace('_', ' ').toUpperCase().padEnd(20)} ${runs} runs, ${rate}% success`
  );
}

printHeader();
console.log(colors.bright + '📋 Configuration:' + colors.reset);
console.log(`   Total Simulations: ${colors.cyan}${TOTAL_RUNS}${colors.reset}`);
console.log(`   Strategies: ${colors.yellow}${STRATEGIES.length}${colors.reset}`);
console.log(
  `   Runs per strategy: ${colors.cyan}${TOTAL_RUNS / STRATEGIES.length}${colors.reset}\n`
);

console.log(colors.bright + '🎮 Starting simulations...' + colors.reset + '\n');

let completedRuns = 0;
const strategyProgress: Record<Strategy, { runs: number; successes: number }> = {} as any;
STRATEGIES.forEach(s => (strategyProgress[s] = { runs: 0, successes: 0 }));

const results: any[] = [];
const failureReasons: Record<Strategy, Record<string, number>> = {} as any;
STRATEGIES.forEach(s => (failureReasons[s] = {}));

const startTime = Date.now();

for (let i = 0; i < TOTAL_RUNS; i++) {
  const strategy = STRATEGIES[i % STRATEGIES.length];
  const result = GameSimulator.simulateShift(strategy, false);
  results.push(result);

  if (!result.success) {
    const reason = result.gameOverReason || 'Insufficient earnings';
    failureReasons[strategy][reason] = (failureReasons[strategy][reason] || 0) + 1;
  }

  completedRuns++;
  strategyProgress[strategy].runs++;
  if (result.success) strategyProgress[strategy].successes++;

  if (completedRuns % 6 === 0 || completedRuns === TOTAL_RUNS) {
    console.log(colors.bright + 'Progress:' + colors.reset);
    console.log('  ' + printProgressBar(completedRuns, TOTAL_RUNS) + '\n');
    console.log(colors.bright + 'Strategy Status:' + colors.reset);
    STRATEGIES.forEach(s =>
      printStrategyStatus(s, strategyProgress[s].runs, strategyProgress[s].successes)
    );
  }
}

const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);

console.log('\n' + colors.green + colors.bright + '✅ Simulations complete!' + colors.reset);
console.log(`   Completed in ${colors.cyan}${elapsedTime}s${colors.reset}`);
console.log(
  `   Average: ${colors.cyan}${((parseFloat(elapsedTime) / TOTAL_RUNS) * 1000).toFixed(0)}ms${colors.reset} per simulation\n`
);

const strategyStats: Record<
  Strategy,
  { runs: number; successes: number; avgEarnings: number; avgRides: number }
> = {} as any;
STRATEGIES.forEach(strategy => {
  const stratResults = results.filter(r => r.strategy === strategy);
  strategyStats[strategy] = {
    runs: stratResults.length,
    successes: stratResults.filter(r => r.success).length,
    avgEarnings: Math.round(
      stratResults.reduce((sum, r) => sum + r.finalEarnings, 0) / stratResults.length
    ),
    avgRides:
      Math.round(
        (stratResults.reduce((sum, r) => sum + r.ridesCompleted, 0) / stratResults.length) * 10
      ) / 10,
  };
});

const stats = {
  totalRuns: TOTAL_RUNS,
  successRate: (results.filter(r => r.success).length / TOTAL_RUNS) * 100,
  averageEarnings: Math.round(results.reduce((sum, r) => sum + r.finalEarnings, 0) / TOTAL_RUNS),
  averageRides:
    Math.round((results.reduce((sum, r) => sum + r.ridesCompleted, 0) / TOTAL_RUNS) * 10) / 10,
  strategyResults: strategyStats,
};

GameSimulator.printReport(stats);

console.log(colors.bright + '\n📋 FAILURE ANALYSIS' + colors.reset);
console.log('='.repeat(80));
STRATEGIES.forEach(strategy => {
  const reasons = failureReasons[strategy];
  if (Object.keys(reasons).length > 0) {
    console.log(`\n${strategy.toUpperCase().replace('_', ' ')}:`);
    Object.entries(reasons).forEach(([reason, count]) => {
      console.log(`  ${reason}: ${count} times`);
    });
  }
});
console.log('\n' + '='.repeat(80));

const outputPath = './test-results.json';
const detailedResults = {
  timestamp: new Date().toISOString(),
  summary: stats,
  failureReasons,
  allResults: results,
};
fs.writeFileSync(outputPath, JSON.stringify(detailedResults, null, 2));
console.log(colors.dim + `\n💾 Detailed results saved to: ${outputPath}` + colors.reset + '\n');
