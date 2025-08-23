import './StatusBar.module.css';

const StatusBar = ({ gameState }) => {
  // Format time from minutes to hours:minutes
  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}`;
  };

  return (
    <div className="grid grid-cols-4 gap-3 p-4 bg-gray-800 rounded-lg mb-5 border border-gray-600">
      <div className="text-center flex flex-col gap-1">
        <span className="text-xl">⛽</span>
        <span className="text-gray-200">{gameState.fuel}%</span>
      </div>
      <div className="text-center flex flex-col gap-1">
        <span className="text-xl">💰</span>
        <span className="text-gray-200">${gameState.earnings}</span>
      </div>
      <div className="text-center flex flex-col gap-1">
        <span className="text-xl">🕐</span>
        <span className="text-gray-200">{formatTime(gameState.timeRemaining)}</span>
      </div>
      <div className="text-center flex flex-col gap-1">
        <span className="text-xl">🚗</span>
        <span className="text-gray-200">{gameState.ridesCompleted}</span>
      </div>
    </div>
  );
};

export default StatusBar;