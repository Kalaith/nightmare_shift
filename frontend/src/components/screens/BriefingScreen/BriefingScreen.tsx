import type { GameState, Rule } from '../../../types/game';
import { gameApi } from '../../../api/gameApi';

interface BriefingScreenProps {
  gameState: GameState;
  onStartShift: () => void;
}

const BriefingScreen: React.FC<BriefingScreenProps> = ({ gameState, onStartShift }) => {
  const [rules, setRules] = React.useState<Rule[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;

    // Always fetch fresh rules for the briefing screen
    setIsLoading(true);
    gameApi.getDailyRules()
      .then(fetchedRules => {
        if (mounted) {
          setRules(fetchedRules);
          setIsLoading(false);
        }
      })
      .catch(err => {
        console.error("Failed to load daily rules", err);
        if (mounted) setIsLoading(false);
      });

    return () => { mounted = false; };
  }, []);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'text-green-400 bg-green-900/20 border-green-500/30';
      case 'medium':
        return 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30';
      case 'hard':
        return 'text-red-400 bg-red-900/20 border-red-500/30';
      default:
        return 'text-gray-400 bg-gray-900/20 border-gray-500/30';
    }
  };

  return (
    <div className="min-h-screen p-5 bg-gradient-to-b from-gray-800 to-slate-900 text-white">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-teal-300 mb-2 drop-shadow-lg">
            📋 Night Shift Briefing
          </h1>
          <p className="text-lg text-gray-300">Your rules for tonight's shift</p>
        </div>

        <div className="space-y-4 mb-8">
          {isLoading ? (
            <div className="text-center py-12 text-teal-200/50 animate-pulse border border-gray-600 rounded-lg bg-gray-800/20">
              <span className="text-3xl mb-4 block">📻</span>
              Receiving Dispatch Instructions...
            </div>
          ) : rules.length === 0 ? (
            <div className="text-center py-8 text-gray-400 border border-gray-600 rounded-lg bg-gray-800/20">
              No specific rules tonight. Drive safe.
            </div>
          ) : (
            rules.map((rule, index) => (
              <div
                key={rule.id}
                className="bg-gray-800/50 border border-gray-600 rounded-lg p-4 flex gap-4"
              >
                <div className="flex-shrink-0 w-8 h-8 bg-teal-300 text-gray-800 rounded-full flex items-center justify-center font-bold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-xl font-semibold text-teal-300">{rule.title}</h3>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded border ${getDifficultyColor(rule.difficulty)}`}
                    >
                      {rule.difficulty.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-gray-300 leading-relaxed">{rule.description}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="text-center">
          <p className="text-red-400 font-medium mb-6 text-lg">
            ⚠️ Breaking any rule may result in... consequences
          </p>
          <button
            onClick={onStartShift}
            className="bg-teal-300 text-gray-800 py-3 px-8 rounded-lg text-xl font-semibold hover:bg-teal-400 transition-colors shadow-lg"
          >
            Start Shift
          </button>
        </div>
      </div>
    </div>
  );
};

export default BriefingScreen;
