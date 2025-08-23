import './DrivingState.module.css';

const DrivingState = ({ gameState, onHandleDrivingChoice, onGameOver }) => {
  const passenger = gameState.currentPassenger;
  const phase = gameState.currentDrivingPhase;
  const location = gameState.currentLocation;

  const handleFuelStop = () => {
    const noLookRule = gameState.currentRules?.find(rule => rule.id === 1);
    if (noLookRule && phase === 'destination') {
      onGameOver("You stopped for fuel with a passenger in the car. Unable to watch them while pumping gas, they escaped... or worse, they're still watching you.");
      return;
    }
    
    // Handle fuel purchase and continue driving
    onHandleDrivingChoice('fuel_stop', phase);
  };

  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-5">
      <div className="text-center mb-6">
        <h3 className="text-teal-300 text-xl mb-3">
          {phase === 'pickup' ? 'Driving to pickup...' : 'Driving to destination...'}
        </h3>
        <p className="text-gray-400 italic">
          {location ? location.description : 'A mysterious location shrouded in darkness...'}
        </p>
      </div>
      
      <div className="space-y-3">
        <button 
          onClick={() => onHandleDrivingChoice('standard', phase)}
          className="w-full bg-gray-800 border border-gray-600 rounded p-4 text-left text-gray-200 hover:bg-gray-700 hover:border-teal-300 transition-colors"
        >
          Take the standard route
        </button>
        
        <button 
          onClick={() => onHandleDrivingChoice('shortcut', phase)}
          className="w-full bg-gray-800 border border-gray-600 rounded p-4 text-left text-gray-200 hover:bg-gray-700 hover:border-teal-300 transition-colors"
        >
          Take a shortcut to save time
        </button>
        
        {gameState.fuel < 50 && (
          <button 
            onClick={handleFuelStop}
            className="w-full bg-gray-800 border border-red-400/50 rounded p-4 text-left text-gray-200 hover:bg-red-400/10 hover:border-red-400 transition-colors"
          >
            Stop for fuel first
          </button>
        )}
      </div>
    </div>
  );
};

export default DrivingState;