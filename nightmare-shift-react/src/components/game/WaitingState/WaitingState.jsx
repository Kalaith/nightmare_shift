import { GAME_CONSTANTS } from '../../../data/constants.js';
import './WaitingState.module.css';

const WaitingState = ({ gameState, setShowInventory, setGameState }) => {
  const handleGetFuel = () => {
    if (gameState.earnings >= GAME_CONSTANTS.FUEL_COST) {
      setGameState(prev => ({
        ...prev,
        fuel: Math.min(100, prev.fuel + GAME_CONSTANTS.FUEL_AMOUNT),
        earnings: prev.earnings - GAME_CONSTANTS.FUEL_COST,
        timeRemaining: prev.timeRemaining - GAME_CONSTANTS.FUEL_TIME_COST
      }));
    } else {
      alert("Not enough money for fuel!");
    }
  };

  return (
    <div className="text-center py-8 px-4">
      <div className="text-8xl mb-6 opacity-70">🚗</div>
      <h3 className="text-xl text-gray-200 mb-2">Waiting for ride requests...</h3>
      <p className="text-gray-400 mb-6">Stay alert. The night is full of surprises.</p>
      
      <div className="flex gap-3 justify-center">
        <button 
          onClick={() => setShowInventory(true)}
          className="bg-gray-700 text-gray-200 py-2 px-4 rounded hover:bg-gray-600 transition-colors"
        >
          🎒 Inventory
        </button>
        <button 
          onClick={handleGetFuel}
          className="border border-gray-600 text-gray-200 py-2 px-4 rounded hover:bg-gray-700 transition-colors"
        >
          ⛽ Get Fuel (${GAME_CONSTANTS.FUEL_COST})
        </button>
      </div>
    </div>
  );
};

export default WaitingState;