import './BackstoryNotificationModal.module.css';

const BackstoryNotificationModal = ({ gameState, onClose }) => {
  const passenger = gameState.currentPassenger;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 border border-blue-400/30 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="text-center mb-4">
          <div className="text-4xl mb-3">📜</div>
          <h3 className="text-blue-400 text-xl mb-2">Backstory Revealed</h3>
          <p className="text-gray-300 text-sm">You've learned something about this passenger...</p>
        </div>
        
        {passenger && (
          <div className="bg-blue-400/10 border border-blue-400/30 rounded p-4 mb-4">
            <h4 className="text-blue-300 font-medium mb-2">{passenger.name}</h4>
            <p className="text-blue-200 text-sm">
              {passenger.backstoryDetails || "Their past is shrouded in mystery..."}
            </p>
          </div>
        )}
        
        <div className="text-center">
          <button 
            onClick={onClose}
            className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-500 transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default BackstoryNotificationModal;