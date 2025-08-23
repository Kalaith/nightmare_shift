import './BriefingScreen.module.css';

const BriefingScreen = ({ gameState, onStartShift }) => {
  return (
    <div className="min-h-screen p-5 flex flex-col bg-gradient-to-b from-gray-800 to-slate-900">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-semibold text-gray-200 mb-4">Tonight's Shift Rules</h2>
        <p className="text-orange-400 font-medium text-center mb-6 p-3 bg-orange-400/10 border border-orange-400/30 rounded-lg">
          ⚠️ Violation of these rules may result in termination
        </p>
      </div>
      
      <div className="flex-1 mb-8">
        <div className="space-y-4">
          {gameState.currentRules?.map(rule => (
            <div key={rule.id} className={`bg-gray-800 border rounded-lg p-5 shadow-md ${
              rule.type === 'conditional' ? 'border-yellow-400/50' :
              rule.type === 'conflicting' ? 'border-red-400/50' :
              'border-gray-600'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <div className="text-xl font-semibold text-teal-300">{rule.title}</div>
                {rule.type === 'conditional' && <span className="text-yellow-400 text-sm">CONDITIONAL</span>}
                {rule.type === 'conflicting' && <span className="text-red-400 text-sm">CONFLICTING</span>}
              </div>
              <p className="text-gray-200 mb-2">{rule.description}</p>
              {rule.conditionHint && (
                <p className="text-yellow-400 text-sm italic">• {rule.conditionHint}</p>
              )}
            </div>
          ))}
          
          {/* Show rule conflicts */}
          {gameState.ruleConflicts && gameState.ruleConflicts.length > 0 && (
            <div className="bg-red-400/10 border border-red-400/30 rounded-lg p-4 mt-4">
              <h4 className="text-red-400 font-semibold mb-2">⚠️ Rule Conflicts Detected:</h4>
              {gameState.ruleConflicts.map((conflict, index) => (
                <p key={index} className="text-red-300 text-sm mb-1">
                  • {conflict.description}
                </p>
              ))}
              <p className="text-red-400 text-sm mt-2 italic">
                You must choose which rule to follow when conflicts arise...
              </p>
            </div>
          )}
          
          {/* Show difficulty level */}
          <div className="text-center mt-4">
            <span className="text-gray-400 text-sm">
              Difficulty Level: {gameState.difficultyLevel || 0}/4
              {gameState.hiddenRules && gameState.hiddenRules.length > 0 && 
                ` • ${gameState.hiddenRules.length} hidden rule(s) active`
              }
            </span>
          </div>
        </div>
      </div>
      
      <div className="text-center">
        <p className="text-red-400 font-medium mb-5">Memorize these rules. Your life depends on it.</p>
        <button 
          onClick={onStartShift}
          className="w-full bg-teal-300 text-gray-800 py-3 px-5 rounded-lg text-lg font-medium hover:bg-teal-400 transition-colors"
        >
          I Understand - Start Shift
        </button>
      </div>
    </div>
  );
};

export default BriefingScreen;