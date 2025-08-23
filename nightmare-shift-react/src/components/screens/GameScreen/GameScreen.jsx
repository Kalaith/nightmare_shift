import { useState } from 'react';
import StatusBar from '../../game/StatusBar/StatusBar.jsx';
import WaitingState from '../../game/WaitingState/WaitingState.jsx';
import RideRequestState from '../../game/RideRequestState/RideRequestState.jsx';
import DrivingState from '../../game/DrivingState/DrivingState.jsx';
import InteractionState from '../../game/InteractionState/InteractionState.jsx';
import InventoryModal from '../../game/InventoryModal/InventoryModal.jsx';
import BackstoryNotificationModal from '../../game/BackstoryNotificationModal/BackstoryNotificationModal.jsx';
import './GameScreen.module.css';

const GameScreen = ({ 
  gameState, 
  onSaveGame, 
  onEndShift,
  showInventory,
  setShowInventory,
  ...gameProps 
}) => {
  const [showQuickRules, setShowQuickRules] = useState(false);

  const handleEndShiftEarly = () => {
    const confirm = window.confirm("Are you sure you want to end your shift early? This will count as a failed shift.");
    if (confirm) {
      onEndShift(false);
    }
  };

  return (
    <div className="min-h-screen p-5 flex flex-col bg-gradient-to-b from-gray-800 to-slate-900">
      <StatusBar gameState={gameState} />
      
      {/* Game Controls Header */}
      <div className="flex justify-between items-center mb-5">
        <div className="flex gap-3">
          {/* Quick Rules Reference */}
          <div className="relative">
            <button 
              onClick={() => setShowQuickRules(!showQuickRules)}
              className="bg-transparent border border-gray-600 text-gray-200 py-2 px-3 rounded text-sm hover:bg-gray-700 transition-colors"
            >
              📋 Rules
            </button>
            {showQuickRules && (
              <div className="absolute top-full left-0 right-0 bg-gray-800 border border-gray-600 rounded p-3 z-10 shadow-lg mt-1">
                {gameState.currentRules?.map((rule, index) => (
                  <div key={rule.id} className="text-sm text-gray-300 mb-2 last:mb-0">
                    • {rule.description}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Save Game Button */}
          <button 
            onClick={onSaveGame}
            className="bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-500 transition-colors"
          >
            💾 Save
          </button>
        </div>
        
        {/* End Shift Early Button */}
        <button 
          onClick={handleEndShiftEarly}
          className="bg-red-600 text-white py-2 px-4 rounded-lg text-sm hover:bg-red-500 transition-colors"
        >
          ⏹️ End Shift Early
        </button>
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1">
        {gameState.gamePhase === 'waiting' && (
          <WaitingState 
            gameState={gameState}
            setShowInventory={setShowInventory}
            {...gameProps}
          />
        )}
        {gameState.gamePhase === 'rideRequest' && (
          <RideRequestState 
            gameState={gameState}
            {...gameProps}
          />
        )}
        {gameState.gamePhase === 'driving' && (
          <DrivingState 
            gameState={gameState}
            {...gameProps}
          />
        )}
        {gameState.gamePhase === 'interaction' && (
          <InteractionState 
            gameState={gameState}
            {...gameProps}
          />
        )}
      </div>

      {/* Inventory Modal */}
      {showInventory && (
        <InventoryModal 
          gameState={gameState}
          onClose={() => setShowInventory(false)}
          {...gameProps}
        />
      )}
      
      {/* Backstory Notification Modal */}
      {gameState.showBackstoryNotification && (
        <BackstoryNotificationModal 
          gameState={gameState}
          {...gameProps}
        />
      )}
    </div>
  );
};

export default GameScreen;