import { useState, useEffect } from 'react'
import './App.css'

// Game Data
const gameData = {
  shift_rules: [
    {
      id: 1,
      title: "No Eye Contact",
      description: "Do not look directly at passengers tonight",
      difficulty: "medium"
    },
    {
      id: 2, 
      title: "Silent Night",
      description: "No radio or music allowed during rides",
      difficulty: "easy"
    },
    {
      id: 3,
      title: "Cash Only",
      description: "Do not accept tips of any kind tonight",
      difficulty: "hard"
    },
    {
      id: 4,
      title: "Windows Sealed",
      description: "Keep all windows closed at all times",
      difficulty: "medium"
    },
    {
      id: 5,
      title: "Route Restriction",
      description: "Do not deviate from GPS route for any reason",
      difficulty: "hard"
    }
  ],
  passengers: [
    {
      id: 1,
      name: "Mrs. Chen",
      photo: "👵",
      description: "Elderly woman, going to Riverside Cemetery",
      pickup: "Downtown Apartments",
      destination: "Riverside Cemetery", 
      personalRule: "Hates bright lights - will ask you to dim dashboard",
      supernatural: "Ghost of former taxi passenger",
      fare: 15,
      items: ["old locket", "withered flowers"],
      dialogue: ["It's so cold tonight, isn't it?", "I haven't been home in so long...", "Thank you for the ride, dear"]
    },
    {
      id: 2,
      name: "Jake Morrison", 
      photo: "👨‍💼",
      description: "Young professional, unusual pale complexion",
      pickup: "Office District",
      destination: "Industrial Warehouse",
      personalRule: "Don't ask about his work - becomes agitated",
      supernatural: "Vampire or undead worker",
      fare: 22,
      items: ["strange coins", "business card with no company name"],
      dialogue: ["Working late again...", "Do you mind if I keep the windows up?", "Some jobs you just can't talk about"]
    },
    {
      id: 3,
      name: "Sarah Woods",
      photo: "👩‍🦰", 
      description: "Young woman with dirt under her fingernails",
      pickup: "Forest Road",
      destination: "Downtown Hotel",
      personalRule: "Gets nervous if you take highway - prefers back roads",
      supernatural: "Escaped from something in the woods",
      fare: 28,
      items: ["muddy branch", "torn fabric", "cash with soil on it"],
      dialogue: ["I need to get back to civilization", "Stay away from the woods tonight", "They might still be following"]
    },
    {
      id: 4,
      name: "Dr. Hollow",
      photo: "👨‍⚕️",
      description: "Doctor with old-fashioned medical bag",
      pickup: "Abandoned Hospital",
      destination: "Suburban House",
      personalRule: "Will offer medical advice - don't accept treatment",
      supernatural: "Former doctor who lost license for unethical experiments",
      fare: 35,
      items: ["antique syringe", "prescription pad", "surgical tools"],
      dialogue: ["House calls are so rare these days", "I can help with any pain you're feeling", "Medicine has come so far since my day"]
    },
    {
      id: 5,
      name: "The Collector",
      photo: "🕴️",
      description: "Well-dressed figure with multiple briefcases",
      pickup: "Antique Shop",
      destination: "Private Residence",
      personalRule: "Will try to buy things from your car - don't sell anything",
      supernatural: "Trades in supernatural artifacts and souls", 
      fare: 50,
      items: ["crystal pendant", "ancient coin", "contract paper"],
      dialogue: ["I see you have interesting items", "Everything has a price", "I make excellent deals"]
    }
  ],
  locations: [
    {
      name: "Downtown Apartments",
      description: "Flickering streetlights illuminate empty sidewalks",
      atmosphere: "Urban decay"
    },
    {
      name: "Riverside Cemetery", 
      description: "Ancient tombstones shrouded in fog",
      atmosphere: "Haunted"
    },
    {
      name: "Office District",
      description: "Glass towers with only a few lights on",
      atmosphere: "Corporate desolation"
    },
    {
      name: "Industrial Warehouse",
      description: "Loading docks and chain-link fences",
      atmosphere: "Abandoned industry"
    },
    {
      name: "Forest Road",
      description: "Tall trees block out the moonlight",
      atmosphere: "Wilderness danger"
    },
    {
      name: "Abandoned Hospital",
      description: "Broken windows and overgrown parking lot",
      atmosphere: "Medical horror"
    }
  ]
};

function App() {
  // Game State
  const [gameState, setGameState] = useState({
    currentScreen: 'loading',
    fuel: 75,
    earnings: 0,
    timeRemaining: 480, // 8 hours in minutes
    ridesCompleted: 0,
    rulesViolated: 0,
    currentRules: [],
    inventory: [],
    currentPassenger: null,
    currentRide: null,
    gamePhase: 'waiting',
    usedPassengers: []
  });

  const [showQuickRules, setShowQuickRules] = useState(false);
  const [showInventory, setShowInventory] = useState(false);

  // Game timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      if (gameState.currentScreen === 'game' && gameState.timeRemaining > 0) {
        setGameState(prev => {
          const newTime = prev.timeRemaining - 1;
          if (newTime <= 0) {
            setTimeout(() => endShift(false), 100);
          }
          return { ...prev, timeRemaining: newTime };
        });
      }
    }, 30000); // Slower timer for gameplay

    return () => clearInterval(timer);
  }, [gameState.currentScreen, gameState.timeRemaining]);

  // Screen management
  const showScreen = (screenName) => {
    setGameState(prev => ({ ...prev, currentScreen: screenName }));
  };

  // Generate shift rules
  const generateShiftRules = () => {
    const shuffled = [...gameData.shift_rules].sort(() => 0.5 - Math.random());
    const selectedRules = shuffled.slice(0, 3 + Math.floor(Math.random() * 2));
    setGameState(prev => ({ ...prev, currentRules: selectedRules }));
  };

  // Get random passenger
  const getRandomPassenger = () => {
    const availablePassengers = gameData.passengers.filter(p => !gameState.usedPassengers.includes(p.id));
    if (availablePassengers.length === 0) return null;
    
    const passenger = availablePassengers[Math.floor(Math.random() * availablePassengers.length)];
    setGameState(prev => ({ 
      ...prev, 
      usedPassengers: [...prev.usedPassengers, passenger.id],
      currentPassenger: passenger
    }));
    return passenger;
  };

  // Game functions
  const startGame = () => {
    generateShiftRules();
    showScreen('briefing');
  };

  const startShift = () => {
    showScreen('game');
    setGameState(prev => ({ ...prev, gamePhase: 'waiting' }));
    
    setTimeout(() => {
      showRideRequest();
    }, 2000 + Math.random() * 3000);
  };

  const showRideRequest = () => {
    const passenger = getRandomPassenger();
    if (!passenger) {
      endShift(true);
      return;
    }
    setGameState(prev => ({ ...prev, gamePhase: 'rideRequest' }));
  };

  const acceptRide = () => {
    if (gameState.fuel < 20) {
      gameOver("You ran out of fuel with a passenger in the car. They were not pleased...");
      return;
    }
    startDriving('pickup');
  };

  const startDriving = (phase) => {
    const passenger = gameState.currentPassenger;
    const location = gameData.locations.find(loc => 
      loc.name === (phase === 'pickup' ? passenger.pickup : passenger.destination)
    );
    
    setGameState(prev => ({ 
      ...prev, 
      gamePhase: 'driving',
      currentDrivingPhase: phase,
      currentLocation: location
    }));
  };

  const handleDrivingChoice = (choice, phase) => {
    // Use fuel
    const fuelUsed = Math.floor(Math.random() * 15) + 10;
    const timeUsed = choice === 'shortcut' ? 15 : 25;
    
    // Check for rule violations
    if (choice === 'shortcut') {
      const routeRestriction = gameState.currentRules.find(rule => rule.id === 5);
      if (routeRestriction) {
        gameOver("You deviated from the GPS route. Your passenger noticed... and they were not forgiving.");
        return;
      }
    }
    
    setGameState(prev => ({ 
      ...prev, 
      fuel: prev.fuel - fuelUsed,
      timeRemaining: prev.timeRemaining - timeUsed
    }));
    
    if (phase === 'pickup') {
      startPassengerInteraction();
    } else {
      completeRide();
    }
  };

  const startPassengerInteraction = () => {
    const passenger = gameState.currentPassenger;
    const dialogue = passenger.dialogue[Math.floor(Math.random() * passenger.dialogue.length)];
    
    setGameState(prev => ({ 
      ...prev, 
      gamePhase: 'interaction',
      currentDialogue: dialogue
    }));
  };

  const completeRide = () => {
    const passenger = gameState.currentPassenger;
    
    setGameState(prev => ({ 
      ...prev, 
      earnings: prev.earnings + passenger.fare,
      ridesCompleted: prev.ridesCompleted + 1,
      inventory: [...prev.inventory, ...passenger.items.map(item => ({
        name: item,
        source: passenger.name
      }))],
      gamePhase: 'waiting'
    }));
    
    // Check if shift should end
    setTimeout(() => {
      if (gameState.timeRemaining <= 60 || gameState.fuel <= 15) {
        endShift(true);
      } else {
        setTimeout(() => {
          showRideRequest();
        }, 3000 + Math.random() * 4000);
      }
    }, 1000);
  };

  const continueToDestination = () => {
    startDriving('destination');
  };

  const gameOver = (reason) => {
    setGameState(prev => ({ 
      ...prev, 
      rulesViolated: prev.rulesViolated + 1,
      gameOverReason: reason
    }));
    showScreen('gameOver');
  };

  const endShift = (successful) => {
    if (successful) {
      const survivalBonus = 50;
      setGameState(prev => ({ 
        ...prev, 
        earnings: prev.earnings + survivalBonus,
        survivalBonus
      }));
      showScreen('success');
    } else {
      gameOver("Time ran out or you ran out of fuel. The night shift waits for no one...");
    }
  };

  const resetGame = () => {
    setGameState({
      currentScreen: 'loading',
      fuel: 75,
      earnings: 0,
      timeRemaining: 480,
      ridesCompleted: 0,
      rulesViolated: 0,
      currentRules: [],
      inventory: [],
      currentPassenger: null,
      currentRide: null,
      gamePhase: 'waiting',
      usedPassengers: []
    });
  };

  // Format time display
  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}`;
  };

  // Loading Screen Component
  const LoadingScreen = () => (
    <div className="min-h-screen p-5 flex flex-col bg-gradient-to-b from-gray-800 to-slate-900">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-teal-300 mb-2 drop-shadow-lg">🚗 NightShift</h1>
        <p className="text-lg text-gray-300">Professional Night Transportation</p>
      </div>
      <div className="flex-1 flex flex-col justify-center items-center gap-6">
        <div className="w-15 h-15 border-3 border-gray-600 border-t-teal-300 rounded-full animate-spin"></div>
        <p className="text-gray-200">Connecting to dispatch...</p>
      </div>
      <button 
        onClick={startGame}
        className="w-full bg-teal-300 text-gray-800 py-3 px-5 rounded-lg text-lg font-medium hover:bg-teal-400 transition-colors"
      >
        Start Shift
      </button>
    </div>
  );

  // Shift Briefing Screen Component
  const ShiftBriefingScreen = () => (
    <div className="min-h-screen p-5 flex flex-col bg-gradient-to-b from-gray-800 to-slate-900">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-semibold text-gray-200 mb-4">Tonight's Shift Rules</h2>
        <p className="text-orange-400 font-medium text-center mb-6 p-3 bg-orange-400/10 border border-orange-400/30 rounded-lg">
          ⚠️ Violation of these rules may result in termination
        </p>
      </div>
      <div className="flex-1 mb-8">
        <div className="space-y-4">
          {gameState.currentRules.map(rule => (
            <div key={rule.id} className="bg-gray-800 border border-gray-600 rounded-lg p-5 shadow-md">
              <div className="text-xl font-semibold text-teal-300 mb-2">{rule.title}</div>
              <p className="text-gray-200">{rule.description}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="text-center">
        <p className="text-red-400 font-medium mb-5">Memorize these rules. Your life depends on it.</p>
        <button 
          onClick={startShift}
          className="w-full bg-teal-300 text-gray-800 py-3 px-5 rounded-lg text-lg font-medium hover:bg-teal-400 transition-colors"
        >
          I Understand - Start Shift
        </button>
      </div>
    </div>
  );

  // Status Bar Component
  const StatusBar = () => (
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

  // Game Screen Component
  const GameScreen = () => (
    <div className="min-h-screen p-5 flex flex-col bg-gradient-to-b from-gray-800 to-slate-900">
      <StatusBar />
      
      {/* Quick Rules Reference */}
      <div className="mb-5 relative">
        <button 
          onClick={() => setShowQuickRules(!showQuickRules)}
          className="bg-transparent border border-gray-600 text-gray-200 py-2 px-3 rounded text-sm hover:bg-gray-700 transition-colors"
        >
          📋 Rules
        </button>
        {showQuickRules && (
          <div className="absolute top-full left-0 right-0 bg-gray-800 border border-gray-600 rounded p-3 z-10 shadow-lg mt-1">
            {gameState.currentRules.map((rule, index) => (
              <div key={rule.id} className="text-sm text-gray-300 mb-2 last:mb-0">
                • {rule.description}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1">
        {gameState.gamePhase === 'waiting' && <WaitingState />}
        {gameState.gamePhase === 'rideRequest' && <RideRequestState />}
        {gameState.gamePhase === 'driving' && <DrivingState />}
        {gameState.gamePhase === 'interaction' && <InteractionState />}
      </div>

      {/* Inventory Modal */}
      {showInventory && <InventoryModal />}
    </div>
  );

  // Waiting State Component
  const WaitingState = () => (
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
          onClick={() => {
            if (gameState.earnings >= 25) {
              setGameState(prev => ({
                ...prev,
                fuel: Math.min(100, prev.fuel + 50),
                earnings: prev.earnings - 25,
                timeRemaining: prev.timeRemaining - 15
              }));
            } else {
              alert("Not enough money for fuel!");
            }
          }}
          className="border border-gray-600 text-gray-200 py-2 px-4 rounded hover:bg-gray-700 transition-colors"
        >
          ⛽ Get Fuel
        </button>
      </div>
    </div>
  );

  // Ride Request State Component
  const RideRequestState = () => {
    const passenger = gameState.currentPassenger;
    if (!passenger) return null;

    return (
      <div className="bg-gray-800 border border-gray-600 rounded-lg p-5 shadow-md">
        <div className="flex gap-4 mb-6">
          <div className="flex-shrink-0 w-20 h-20 bg-blue-400/20 rounded-lg flex items-center justify-center text-4xl border-2 border-gray-600">
            {passenger.photo}
          </div>
          <div className="flex-1">
            <h3 className="text-teal-300 text-xl mb-2">{passenger.name}</h3>
            <p className="text-gray-300 mb-4">{passenger.description}</p>
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
            onClick={acceptRide}
            className="flex-1 bg-teal-300 text-gray-800 py-3 px-5 rounded-lg font-medium hover:bg-teal-400 transition-colors"
          >
            Accept Ride
          </button>
          <button 
            onClick={() => {
              setGameState(prev => ({ 
                ...prev, 
                timeRemaining: prev.timeRemaining - 5,
                gamePhase: 'waiting'
              }));
              setTimeout(() => {
                showRideRequest();
              }, 1000 + Math.random() * 2000);
            }}
            className="border border-gray-600 text-gray-200 py-3 px-5 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Decline
          </button>
        </div>
      </div>
    );
  };

  // Driving State Component
  const DrivingState = () => {
    const passenger = gameState.currentPassenger;
    const phase = gameState.currentDrivingPhase;
    const location = gameState.currentLocation;
    
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
            onClick={() => handleDrivingChoice('standard', phase)}
            className="w-full bg-gray-800 border border-gray-600 rounded p-4 text-left text-gray-200 hover:bg-gray-700 hover:border-teal-300 transition-colors"
          >
            Take the standard route
          </button>
          <button 
            onClick={() => handleDrivingChoice('shortcut', phase)}
            className="w-full bg-gray-800 border border-gray-600 rounded p-4 text-left text-gray-200 hover:bg-gray-700 hover:border-teal-300 transition-colors"
          >
            Take a shortcut to save time
          </button>
          {gameState.fuel < 50 && (
            <button 
              onClick={() => {
                const noLookRule = gameState.currentRules.find(rule => rule.id === 1);
                if (noLookRule && phase === 'destination') {
                  gameOver("You stopped for fuel with a passenger in the car. Unable to watch them while pumping gas, they escaped... or worse, they're still watching you.");
                  return;
                }
                setGameState(prev => ({
                  ...prev,
                  fuel: Math.min(100, prev.fuel + 40),
                  earnings: prev.earnings - 25,
                  timeRemaining: prev.timeRemaining - 10
                }));
                handleDrivingChoice('standard', phase);
              }}
              className="w-full bg-gray-800 border border-red-400/50 rounded p-4 text-left text-gray-200 hover:bg-red-400/10 hover:border-red-400 transition-colors"
            >
              Stop for fuel first
            </button>
          )}
        </div>
      </div>
    );
  };

  // Passenger Interaction Component
  const InteractionState = () => {
    const passenger = gameState.currentPassenger;
    const dialogue = gameState.currentDialogue;
    
    const createInteractionChoices = () => {
      const choices = [];
      
      // Standard polite response
      choices.push({
        text: "Respond politely and continue driving",
        safe: true,
        action: continueToDestination
      });
      
      // Rule-testing choices
      const noLookRule = gameState.currentRules.find(rule => rule.id === 1);
      if (noLookRule) {
        choices.push({
          text: "Look in the rearview mirror to see the passenger",
          dangerous: true,
          action: () => gameOver("You looked directly at your passenger. Their reflection wasn't what you expected... and it was the last thing you ever saw.")
        });
      }
      
      const noMusicRule = gameState.currentRules.find(rule => rule.id === 2);
      if (noMusicRule) {
        choices.push({
          text: "Turn on some music to lighten the mood",
          dangerous: true,
          action: () => gameOver("The music seemed to agitate your passenger greatly. The last notes you heard were... screams.")
        });
      }
      
      const noTipsRule = gameState.currentRules.find(rule => rule.id === 3);
      if (noTipsRule && passenger.id !== 5) {
        choices.push({
          text: "Accept the generous tip they're offering",
          dangerous: true,
          action: () => gameOver("You accepted their 'tip'. It wasn't money... and now you owe them something much more valuable.")
        });
      }
      
      // Passenger-specific choices
      if (passenger.id === 4) { // Dr. Hollow
        choices.push({
          text: "Accept their offer to help with your headache",
          dangerous: true,
          action: () => gameOver("Dr. Hollow's 'treatment' was... unconventional. You won't be needing medical care ever again.")
        });
      }
      
      if (passenger.id === 5) { // The Collector
        choices.push({
          text: "Sell them one of your items",
          dangerous: true,
          action: () => gameOver("The Collector's payment came with a contract... written in something that wasn't ink.")
        });
      }
      
      return choices;
    };

    return (
      <div className="bg-gray-800 border border-gray-600 rounded-lg p-5">
        <div className="mb-6">
          <div className="bg-blue-400/20 rounded p-4 relative italic text-gray-200">
            <div className="absolute top-1 left-2 text-teal-300 text-3xl">"</div>
            <div className="pl-6">{dialogue}</div>
          </div>
        </div>
        <div className="space-y-3">
          {createInteractionChoices().map((choice, index) => (
            <button
              key={index}
              onClick={choice.action}
              className={`w-full bg-gray-800 border rounded p-4 text-left text-gray-200 transition-colors ${
                choice.dangerous 
                  ? 'border-red-400/50 hover:bg-red-400/10 hover:border-red-400' 
                  : 'border-gray-600 hover:bg-gray-700 hover:border-teal-300'
              }`}
            >
              {choice.text}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Inventory Modal Component
  const InventoryModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
      <div className="absolute inset-0 bg-black/80" onClick={() => setShowInventory(false)}></div>
      <div className="bg-gray-800 border border-gray-600 rounded-lg max-w-md w-full max-h-4/5 overflow-hidden shadow-lg relative z-10">
        <div className="flex justify-between items-center p-5 border-b border-gray-600">
          <h3 className="text-teal-300 text-xl">Your Inventory</h3>
          <button 
            onClick={() => setShowInventory(false)}
            className="text-gray-400 hover:text-gray-200 text-3xl leading-none w-8 h-8 flex items-center justify-center"
          >
            ×
          </button>
        </div>
        <div className="p-5 max-h-96 overflow-y-auto">
          <div className="grid grid-cols-1 gap-3 mb-5">
            {gameState.inventory.length === 0 ? (
              <p className="text-gray-400">Your car is clean... for now.</p>
            ) : (
              gameState.inventory.map((item, index) => (
                <div key={index} className="bg-yellow-400/20 border border-gray-600 rounded p-3">
                  <h4 className="text-teal-300 text-base mb-2">{item.name}</h4>
                  <p className="text-gray-400 text-sm">Left by: {item.source}</p>
                </div>
              ))
            )}
          </div>
          <p className="text-center text-gray-400 text-sm italic">
            Items left by passengers may have mysterious effects...
          </p>
        </div>
      </div>
    </div>
  );

  // Game Over Screen Component
  const GameOverScreen = () => (
    <div className="min-h-screen p-5 flex items-center justify-center bg-gradient-to-b from-gray-800 to-slate-900">
      <div className="text-center max-w-md mx-auto py-8">
        <h2 className="text-3xl font-semibold text-red-400 mb-6">Shift Terminated</h2>
        <div className="bg-red-400/10 border border-red-400/30 rounded p-5 mb-6 text-red-400">
          <p>{gameState.gameOverReason}</p>
        </div>
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-5 mb-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-400">Rides Completed:</span>
            <span className="text-gray-200">{gameState.ridesCompleted}</span>
          </div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-400">Earnings:</span>
            <span className="text-gray-200">${gameState.earnings}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Rules Violated:</span>
            <span className="text-gray-200">{gameState.rulesViolated}</span>
          </div>
        </div>
        <button 
          onClick={() => {
            resetGame();
            showScreen('loading');
          }}
          className="w-full bg-teal-300 text-gray-800 py-3 px-5 rounded-lg text-lg font-medium hover:bg-teal-400 transition-colors"
        >
          Try Another Shift
        </button>
      </div>
    </div>
  );

  // Success Screen Component
  const SuccessScreen = () => (
    <div className="min-h-screen p-5 flex items-center justify-center bg-gradient-to-b from-gray-800 to-slate-900">
      <div className="text-center max-w-md mx-auto py-8">
        <h2 className="text-3xl font-semibold text-teal-300 mb-6">Shift Complete</h2>
        <p className="text-teal-300 text-lg mb-6">You survived the night and completed your shift!</p>
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-5 mb-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-400">Total Rides:</span>
            <span className="text-gray-200">{gameState.ridesCompleted}</span>
          </div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-400">Total Earnings:</span>
            <span className="text-gray-200">${gameState.earnings}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Bonus:</span>
            <span className="text-gray-200">${gameState.survivalBonus || 50}</span>
          </div>
        </div>
        {gameState.inventory.length > 0 && (
          <div className="mb-6">
            <h4 className="text-teal-300 mb-3">Items Found:</h4>
            {gameState.inventory.map((item, index) => (
              <p key={index} className="text-gray-300">• {item.name} (from {item.source})</p>
            ))}
          </div>
        )}
        <button 
          onClick={() => {
            resetGame();
            generateShiftRules();
            showScreen('briefing');
          }}
          className="w-full bg-teal-300 text-gray-800 py-3 px-5 rounded-lg text-lg font-medium hover:bg-teal-400 transition-colors"
        >
          Start Next Shift
        </button>
      </div>
    </div>
  );

  // Main render
  return (
    <div className="text-gray-200 bg-gray-800 min-h-screen">
      {gameState.currentScreen === 'loading' && <LoadingScreen />}
      {gameState.currentScreen === 'briefing' && <ShiftBriefingScreen />}
      {gameState.currentScreen === 'game' && <GameScreen />}
      {gameState.currentScreen === 'gameOver' && <GameOverScreen />}
      {gameState.currentScreen === 'success' && <SuccessScreen />}
    </div>
  );
}

export default App;