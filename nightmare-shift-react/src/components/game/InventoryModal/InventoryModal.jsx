import './InventoryModal.module.css';

const InventoryModal = ({ gameState, onClose }) => {
  const inventory = gameState.inventory || [];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-teal-300 text-xl">Inventory</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 text-xl"
          >
            ✕
          </button>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {inventory.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-4xl mb-4">📦</p>
              <p>Your inventory is empty</p>
              <p className="text-sm">Collect items from passengers during rides</p>
            </div>
          ) : (
            <div className="space-y-3">
              {inventory.map((item, index) => (
                <div key={index} className="bg-gray-700 rounded p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-gray-200 font-medium">{item.name || item}</h4>
                      {item.source && (
                        <p className="text-gray-400 text-sm">From: {item.source}</p>
                      )}
                      {item.description && (
                        <p className="text-gray-300 text-sm mt-1">{item.description}</p>
                      )}
                    </div>
                    {item.rarity && (
                      <span className={`text-xs px-2 py-1 rounded ${
                        item.rarity === 'rare' ? 'bg-blue-400/20 text-blue-400' :
                        item.rarity === 'legendary' ? 'bg-purple-400/20 text-purple-400' :
                        'bg-gray-600 text-gray-300'
                      }`}>
                        {item.rarity}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="mt-6 text-center">
          <button 
            onClick={onClose}
            className="bg-gray-700 text-gray-200 py-2 px-4 rounded hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default InventoryModal;