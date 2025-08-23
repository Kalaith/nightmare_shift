import './RideRequestState.module.css';

const RideRequestState = ({ gameState, onAcceptRide, onDeclineRide }) => {
  const passenger = gameState.currentPassenger;
  
  if (!passenger) return null;

  const handleDecline = () => {
    // Apply time penalty for declining and trigger next ride request
    onDeclineRide();
  };

  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-5 shadow-md">
      <div className="flex gap-4 mb-6">
        <div className="flex-shrink-0 w-20 h-20 bg-blue-400/20 rounded-lg flex items-center justify-center text-4xl border-2 border-gray-600">
          {passenger.photo}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-teal-300 text-xl">{passenger.name}</h3>
            {passenger.rarity === 'rare' && <span className="text-yellow-400 text-sm">★ RARE</span>}
            {passenger.rarity === 'legendary' && <span className="text-purple-400 text-sm">👑 LEGENDARY</span>}
            {gameState.relationshipTriggered && <span className="text-blue-400 text-sm">🔗 CONNECTED</span>}
          </div>
          <p className="text-gray-300 mb-4">{passenger.description}</p>
          
          {/* Backstory unlock display */}
          {passenger.backstoryUnlocked && (
            <div className="bg-blue-400/10 border border-blue-400/30 rounded p-3 mb-4 text-sm text-blue-400">
              <div className="flex items-center mb-2">
                <span className="mr-2">📜</span>
                <span className="font-semibold">Backstory Revealed:</span>
              </div>
              <p className="text-blue-300">{passenger.backstoryDetails}</p>
            </div>
          )}
          
          {/* Relationship context */}
          {gameState.relationshipTriggered && (
            <div className="bg-blue-400/10 border border-blue-400/30 rounded p-3 mb-4 text-sm text-blue-400">
              <span className="mr-2">🔗</span>
              This passenger has a connection to someone you've met before...
            </div>
          )}
          
          <div className="space-y-2 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">From:</span>
              <span className="text-gray-200">{passenger.pickup}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">To:</span>
              <span className="text-gray-200">{passenger.destination}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Fare:</span>
              <span className="text-teal-300 font-semibold">${passenger.fare}</span>
            </div>
          </div>
          
          {passenger.personalRule && (
            <div className="bg-orange-400/10 border border-orange-400/30 rounded p-3 text-sm text-orange-400">
              <span className="mr-2">⚠️</span>
              {passenger.personalRule}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex gap-3">
        <button 
          onClick={onAcceptRide}
          className="flex-1 bg-teal-300 text-gray-800 py-3 px-5 rounded-lg font-medium hover:bg-teal-400 transition-colors"
        >
          Accept Ride
        </button>
        <button 
          onClick={handleDecline}
          className="border border-gray-600 text-gray-200 py-3 px-5 rounded-lg hover:bg-gray-700 transition-colors"
        >
          Decline
        </button>
      </div>
    </div>
  );
};

export default RideRequestState;