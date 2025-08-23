import './InteractionState.module.css';

const InteractionState = ({ gameState, onContinueToDestination, onGameOver }) => {
  const passenger = gameState.currentPassenger;
  const dialogue = gameState.currentDialogue;

  const createInteractionChoices = () => {
    const choices = [];
    
    // Standard polite response (always available and safe)
    choices.push({
      text: "Respond politely and continue driving",
      safe: true,
      action: onContinueToDestination
    });
    
    // Rule-testing choices based on active rules
    const noLookRule = gameState.currentRules?.find(rule => rule.id === 1);
    if (noLookRule) {
      choices.push({
        text: "Look in the rearview mirror to see the passenger",
        dangerous: true,
        action: () => onGameOver("You looked directly at your passenger. Their reflection wasn't what you expected... and it was the last thing you ever saw.")
      });
    }
    
    const noMusicRule = gameState.currentRules?.find(rule => rule.id === 2);
    if (noMusicRule) {
      choices.push({
        text: "Turn on some music to lighten the mood",
        dangerous: true,
        action: () => onGameOver("The music seemed to agitate your passenger greatly. The last notes you heard were... screams.")
      });
    }
    
    const noTipsRule = gameState.currentRules?.find(rule => rule.id === 3);
    if (noTipsRule && passenger?.id !== 5) {
      choices.push({
        text: "Accept the generous tip they're offering",
        dangerous: true,
        action: () => onGameOver("You accepted their 'tip'. It wasn't money... and now you owe them something much more valuable.")
      });
    }
    
    // Passenger-specific interaction choices
    if (passenger) {
      switch (passenger.id) {
        case 4: // Dr. Hollow
          choices.push({
            text: "Accept their offer to help with your headache",
            dangerous: true,
            action: () => onGameOver("Dr. Hollow's 'treatment' was... unconventional. You won't be needing medical care ever again.")
          });
          break;
          
        case 5: // The Collector
          choices.push({
            text: "Sell them one of your items",
            dangerous: true,
            action: () => onGameOver("The Collector's payment came with a contract... written in something that wasn't ink.")
          });
          break;
          
        case 6: // Tommy Sullivan
          choices.push({
            text: "Ask him why he's out so late",
            dangerous: true,
            action: () => onGameOver("Tommy's eyes went completely black. 'I've been waiting for someone to ask...' were the last words you heard.")
          });
          break;
          
        case 10: // Old Pete
          const windowsRule = gameState.currentRules?.find(rule => rule.id === 4);
          if (windowsRule) {
            choices.push({
              text: "Roll down the windows as he requests",
              dangerous: true,
              action: () => onGameOver("The smell of the harbor flooded in... along with something much worse than seawater.")
            });
          }
          break;
          
        case 11: // Madame Zelda
          choices.push({
            text: "Listen to her fortune about your future",
            dangerous: true,
            action: () => onGameOver("She told you exactly how this ride would end. Knowledge of your fate made it impossible to avoid.")
          });
          break;
          
        case 15: // The Midnight Mayor
          choices.push({
            text: "Follow his direct orders",
            dangerous: true,
            action: () => onGameOver("The Mayor's commands override all other rules... and all other concerns, including your safety.")
          });
          break;
          
        default:
          // No specific interactions for this passenger
          break;
      }
    }
    
    return choices;
  };

  const choices = createInteractionChoices();

  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-5">
      <div className="text-center mb-6">
        <h3 className="text-teal-300 text-xl mb-3">Passenger Interaction</h3>
        <div className="bg-gray-700 border border-gray-600 rounded p-4 mb-4">
          <p className="text-gray-200 italic">
            "{dialogue || 'The passenger speaks to you during the ride...'}"
          </p>
        </div>
        <p className="text-gray-400 text-sm">How do you respond?</p>
      </div>
      
      <div className="space-y-3">
        {choices.map((choice, index) => (
          <button
            key={index}
            onClick={choice.action}
            className={`w-full border rounded p-4 text-left transition-colors ${
              choice.safe 
                ? 'bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700 hover:border-teal-300'
                : choice.dangerous
                  ? 'bg-gray-800 border-red-400/50 text-gray-200 hover:bg-red-400/10 hover:border-red-400'
                  : 'bg-gray-800 border-yellow-400/50 text-gray-200 hover:bg-yellow-400/10 hover:border-yellow-400'
            }`}
          >
            {choice.text}
            {choice.dangerous && <span className="text-red-400 ml-2 text-sm">⚠️ Risky</span>}
            {choice.safe && <span className="text-green-400 ml-2 text-sm">✓ Safe</span>}
          </button>
        ))}
      </div>
    </div>
  );
};

export default InteractionState;