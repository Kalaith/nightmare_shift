// Game Data
const gameData = {
  "shift_rules": [
    {
      "id": 1,
      "title": "No Eye Contact",
      "description": "Do not look directly at passengers tonight",
      "difficulty": "medium"
    },
    {
      "id": 2, 
      "title": "Silent Night",
      "description": "No radio or music allowed during rides",
      "difficulty": "easy"
    },
    {
      "id": 3,
      "title": "Cash Only",
      "description": "Do not accept tips of any kind tonight",
      "difficulty": "hard"
    },
    {
      "id": 4,
      "title": "Windows Sealed",
      "description": "Keep all windows closed at all times",
      "difficulty": "medium"
    },
    {
      "id": 5,
      "title": "Route Restriction",
      "description": "Do not deviate from GPS route for any reason",
      "difficulty": "hard"
    }
  ],
  "passengers": [
    {
      "id": 1,
      "name": "Mrs. Chen",
      "photo": "👵",
      "description": "Elderly woman, going to Riverside Cemetery",
      "pickup": "Downtown Apartments",
      "destination": "Riverside Cemetery", 
      "personalRule": "Hates bright lights - will ask you to dim dashboard",
      "supernatural": "Ghost of former taxi passenger",
      "fare": 15,
      "items": ["old locket", "withered flowers"],
      "dialogue": ["It's so cold tonight, isn't it?", "I haven't been home in so long...", "Thank you for the ride, dear"]
    },
    {
      "id": 2,
      "name": "Jake Morrison", 
      "photo": "👨‍💼",
      "description": "Young professional, unusual pale complexion",
      "pickup": "Office District",
      "destination": "Industrial Warehouse",
      "personalRule": "Don't ask about his work - becomes agitated",
      "supernatural": "Vampire or undead worker",
      "fare": 22,
      "items": ["strange coins", "business card with no company name"],
      "dialogue": ["Working late again...", "Do you mind if I keep the windows up?", "Some jobs you just can't talk about"]
    },
    {
      "id": 3,
      "name": "Sarah Woods",
      "photo": "👩‍🦰", 
      "description": "Young woman with dirt under her fingernails",
      "pickup": "Forest Road",
      "destination": "Downtown Hotel",
      "personalRule": "Gets nervous if you take highway - prefers back roads",
      "supernatural": "Escaped from something in the woods",
      "fare": 28,
      "items": ["muddy branch", "torn fabric", "cash with soil on it"],
      "dialogue": ["I need to get back to civilization", "Stay away from the woods tonight", "They might still be following"]
    },
    {
      "id": 4,
      "name": "Dr. Hollow",
      "photo": "👨‍⚕️",
      "description": "Doctor with old-fashioned medical bag",
      "pickup": "Abandoned Hospital",
      "destination": "Suburban House",
      "personalRule": "Will offer medical advice - don't accept treatment",
      "supernatural": "Former doctor who lost license for unethical experiments",
      "fare": 35,
      "items": ["antique syringe", "prescription pad", "surgical tools"],
      "dialogue": ["House calls are so rare these days", "I can help with any pain you're feeling", "Medicine has come so far since my day"]
    },
    {
      "id": 5,
      "name": "The Collector",
      "photo": "🕴️",
      "description": "Well-dressed figure with multiple briefcases",
      "pickup": "Antique Shop",
      "destination": "Private Residence",
      "personalRule": "Will try to buy things from your car - don't sell anything",
      "supernatural": "Trades in supernatural artifacts and souls", 
      "fare": 50,
      "items": ["crystal pendant", "ancient coin", "contract paper"],
      "dialogue": ["I see you have interesting items", "Everything has a price", "I make excellent deals"]
    }
  ],
  "locations": [
    {
      "name": "Downtown Apartments",
      "description": "Flickering streetlights illuminate empty sidewalks",
      "atmosphere": "Urban decay"
    },
    {
      "name": "Riverside Cemetery", 
      "description": "Ancient tombstones shrouded in fog",
      "atmosphere": "Haunted"
    },
    {
      "name": "Office District",
      "description": "Glass towers with only a few lights on",
      "atmosphere": "Corporate desolation"
    },
    {
      "name": "Industrial Warehouse",
      "description": "Loading docks and chain-link fences",
      "atmosphere": "Abandoned industry"
    },
    {
      "name": "Forest Road",
      "description": "Tall trees block out the moonlight",
      "atmosphere": "Wilderness danger"
    },
    {
      "name": "Abandoned Hospital",
      "description": "Broken windows and overgrown parking lot",
      "atmosphere": "Medical horror"
    }
  ]
};

// Game State
let gameState = {
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
  gamePhase: 'waiting', // waiting, ride-request, driving, interaction
  usedPassengers: []
};

// DOM Elements - will be initialized when DOM is ready
let screens = {};
let gameElements = {};

// Game Functions
function showScreen(screenName) {
  // Hide all screens
  Object.values(screens).forEach(screen => screen.classList.add('hidden'));
  // Show target screen
  screens[screenName].classList.remove('hidden');
  gameState.currentScreen = screenName;
}

function generateShiftRules() {
  // Select 3-4 random rules
  const shuffled = [...gameData.shift_rules].sort(() => 0.5 - Math.random());
  gameState.currentRules = shuffled.slice(0, 3 + Math.floor(Math.random() * 2));
}

function displayShiftRules() {
  const rulesList = gameElements.shiftRulesList;
  rulesList.innerHTML = '';
  
  gameState.currentRules.forEach(rule => {
    const ruleDiv = document.createElement('div');
    ruleDiv.className = 'rule-item';
    ruleDiv.innerHTML = `
      <div class="rule-title">${rule.title}</div>
      <p class="rule-description">${rule.description}</p>
    `;
    rulesList.appendChild(ruleDiv);
  });
}

function displayQuickRules() {
  const quickRulesList = gameElements.quickRules;
  quickRulesList.innerHTML = '';
  
  gameState.currentRules.forEach(rule => {
    const ruleDiv = document.createElement('div');
    ruleDiv.className = 'quick-rule';
    ruleDiv.textContent = `• ${rule.description}`;
    quickRulesList.appendChild(ruleDiv);
  });
}

function updateStatusBar() {
  gameElements.fuelLevel.textContent = `${gameState.fuel}%`;
  gameElements.earnings.textContent = `$${gameState.earnings}`;
  
  const hours = Math.floor(gameState.timeRemaining / 60);
  const minutes = gameState.timeRemaining % 60;
  gameElements.timeRemaining.textContent = `${hours}:${minutes.toString().padStart(2, '0')}`;
  
  gameElements.ridesCount.textContent = gameState.ridesCompleted;
}

function getRandomPassenger() {
  const availablePassengers = gameData.passengers.filter(p => !gameState.usedPassengers.includes(p.id));
  if (availablePassengers.length === 0) return null;
  
  const passenger = availablePassengers[Math.floor(Math.random() * availablePassengers.length)];
  gameState.usedPassengers.push(passenger.id);
  return passenger;
}

function showRideRequest() {
  const passenger = getRandomPassenger();
  if (!passenger) {
    endShift(true); // No more passengers, successful shift
    return;
  }
  
  gameState.currentPassenger = passenger;
  
  // Display passenger info
  document.getElementById('passengerPhoto').textContent = passenger.photo;
  document.getElementById('passengerName').textContent = passenger.name;
  document.getElementById('passengerDescription').textContent = passenger.description;
  document.getElementById('pickupLocation').textContent = passenger.pickup;
  document.getElementById('dropoffLocation').textContent = passenger.destination;
  document.getElementById('farAmount').textContent = `$${passenger.fare}`;
  
  // Show personal rule if exists
  const personalRuleDiv = document.getElementById('personalRule');
  if (passenger.personalRule) {
    document.getElementById('ruleText').textContent = passenger.personalRule;
    personalRuleDiv.classList.remove('hidden');
  } else {
    personalRuleDiv.classList.add('hidden');
  }
  
  showGameState('rideRequest');
}

function showGameState(stateName) {
  // Hide all game states
  document.querySelectorAll('.game-state').forEach(state => {
    state.classList.add('hidden');
  });
  
  // Show target state
  document.getElementById(stateName).classList.remove('hidden');
  gameState.gamePhase = stateName;
}

function acceptRide() {
  if (gameState.fuel < 20) {
    gameOver("You ran out of fuel with a passenger in the car. They were not pleased...");
    return;
  }
  
  startDriving('pickup');
}

function startDriving(phase) {
  const passenger = gameState.currentPassenger;
  const location = gameData.locations.find(loc => 
    loc.name === (phase === 'pickup' ? passenger.pickup : passenger.destination)
  );
  
  const actionText = phase === 'pickup' ? 'Driving to pickup...' : 'Driving to destination...';
  document.getElementById('currentAction').textContent = actionText;
  document.getElementById('locationDescription').textContent = location ? location.description : 'A mysterious location shrouded in darkness...';
  
  // Create driving choices
  const optionsDiv = document.getElementById('drivingOptions');
  optionsDiv.innerHTML = '';
  
  // Standard route choice
  const standardBtn = document.createElement('button');
  standardBtn.className = 'choice-btn';
  standardBtn.textContent = 'Take the standard route';
  standardBtn.onclick = () => handleDrivingChoice('standard', phase);
  optionsDiv.appendChild(standardBtn);
  
  // Shortcut choice (might violate rules)
  const shortcutBtn = document.createElement('button');
  shortcutBtn.className = 'choice-btn';
  shortcutBtn.textContent = 'Take a shortcut to save time';
  shortcutBtn.onclick = () => handleDrivingChoice('shortcut', phase);
  optionsDiv.appendChild(shortcutBtn);
  
  // Check fuel choice
  if (gameState.fuel < 50) {
    const fuelBtn = document.createElement('button');
    fuelBtn.className = 'choice-btn dangerous';
    fuelBtn.textContent = 'Stop for fuel first';
    fuelBtn.onclick = () => handleFuelStop(phase);
    optionsDiv.appendChild(fuelBtn);
  }
  
  showGameState('drivingState');
}

function handleDrivingChoice(choice, phase) {
  // Use fuel
  gameState.fuel -= Math.floor(Math.random() * 15) + 10;
  
  // Use time
  const timeUsed = choice === 'shortcut' ? 15 : 25;
  gameState.timeRemaining -= timeUsed;
  
  // Check for rule violations
  if (choice === 'shortcut') {
    const routeRestriction = gameState.currentRules.find(rule => rule.id === 5);
    if (routeRestriction) {
      gameOver("You deviated from the GPS route. Your passenger noticed... and they were not forgiving.");
      return;
    }
  }
  
  updateStatusBar();
  
  if (phase === 'pickup') {
    // Picked up passenger, now go to destination
    startPassengerInteraction();
  } else {
    // Completed ride
    completeRide();
  }
}

function handleFuelStop(phase) {
  // Check for "don't look at passenger" rule while getting fuel
  const noLookRule = gameState.currentRules.find(rule => rule.id === 1);
  
  if (noLookRule && phase === 'destination') {
    // Player chose to get fuel with passenger in car while having no-look rule
    gameOver("You stopped for fuel with a passenger in the car. Unable to watch them while pumping gas, they escaped... or worse, they're still watching you.");
    return;
  }
  
  gameState.fuel = Math.min(100, gameState.fuel + 40);
  gameState.earnings -= 25; // Cost of fuel
  gameState.timeRemaining -= 10;
  updateStatusBar();
  
  // Continue with original phase
  handleDrivingChoice('standard', phase);
}

function startPassengerInteraction() {
  const passenger = gameState.currentPassenger;
  const dialogue = passenger.dialogue[Math.floor(Math.random() * passenger.dialogue.length)];
  
  document.getElementById('dialogueText').textContent = dialogue;
  
  // Create interaction choices
  const optionsDiv = document.getElementById('interactionOptions');
  optionsDiv.innerHTML = '';
  
  // Response options based on passenger and rules
  createInteractionChoices(optionsDiv, passenger, dialogue);
  
  showGameState('passengerInteraction');
}

function createInteractionChoices(container, passenger, dialogue) {
  const choices = [];
  
  // Standard polite response
  choices.push({
    text: "Respond politely and continue driving",
    safe: true,
    action: () => continueToDestination()
  });
  
  // Rule-testing choices based on current rules
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
  if (noTipsRule && passenger.id !== 5) { // Not the Collector
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
  
  // Render choices
  choices.forEach(choice => {
    const btn = document.createElement('button');
    btn.className = `choice-btn ${choice.dangerous ? 'dangerous' : ''}`;
    btn.textContent = choice.text;
    btn.onclick = choice.action;
    container.appendChild(btn);
  });
}

function continueToDestination() {
  startDriving('destination');
}

function completeRide() {
  const passenger = gameState.currentPassenger;
  
  // Add earnings
  gameState.earnings += passenger.fare;
  gameState.ridesCompleted++;
  
  // Add passenger items to inventory
  passenger.items.forEach(item => {
    gameState.inventory.push({
      name: item,
      source: passenger.name
    });
  });
  
  updateStatusBar();
  
  // Check if shift should end
  if (gameState.timeRemaining <= 60 || gameState.fuel <= 15) {
    endShift(true);
  } else {
    // Wait for next ride
    setTimeout(() => {
      showGameState('waitingState');
      // Trigger next ride after a short delay
      setTimeout(() => {
        showRideRequest();
      }, 3000 + Math.random() * 4000);
    }, 1000);
  }
}

function gameOver(reason) {
  gameState.rulesViolated++;
  
  document.getElementById('gameOverReason').textContent = reason;
  document.getElementById('finalRides').textContent = gameState.ridesCompleted;
  document.getElementById('finalEarnings').textContent = `$${gameState.earnings}`;
  document.getElementById('rulesViolated').textContent = gameState.rulesViolated;
  
  showScreen('gameOver');
}

function endShift(successful) {
  if (successful) {
    const survivalBonus = 50;
    gameState.earnings += survivalBonus;
    
    document.getElementById('successRides').textContent = gameState.ridesCompleted;
    document.getElementById('successEarnings').textContent = `$${gameState.earnings}`;
    document.getElementById('survivalBonus').textContent = `$${survivalBonus}`;
    
    // Display items found
    const itemsDiv = document.getElementById('itemsFound');
    if (gameState.inventory.length > 0) {
      itemsDiv.innerHTML = `
        <h4>Items Found:</h4>
        ${gameState.inventory.map(item => `<p>• ${item.name} (from ${item.source})</p>`).join('')}
      `;
    }
    
    showScreen('success');
  } else {
    gameOver("Time ran out or you ran out of fuel. The night shift waits for no one...");
  }
}

function resetGame() {
  gameState = {
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
  };
  
  updateStatusBar();
  generateShiftRules();
  displayShiftRules();
  displayQuickRules();
}

function showInventory() {
  const inventoryDiv = gameElements.inventoryItems;
  inventoryDiv.innerHTML = '';
  
  if (gameState.inventory.length === 0) {
    inventoryDiv.innerHTML = '<p>Your car is clean... for now.</p>';
  } else {
    gameState.inventory.forEach(item => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'inventory-item';
      itemDiv.innerHTML = `
        <h4>${item.name}</h4>
        <p>Left by: ${item.source}</p>
      `;
      inventoryDiv.appendChild(itemDiv);
    });
  }
  
  gameElements.inventoryModal.classList.remove('hidden');
}

function initializeGame() {
  // Initialize DOM elements
  screens = {
    loading: document.getElementById('loadingScreen'),
    briefing: document.getElementById('shiftBriefing'),
    game: document.getElementById('gameScreen'),
    gameOver: document.getElementById('gameOverScreen'),
    success: document.getElementById('successScreen')
  };

  gameElements = {
    startGameBtn: document.getElementById('startGameBtn'),
    startShiftBtn: document.getElementById('startShiftBtn'),
    shiftRulesList: document.getElementById('shiftRulesList'),
    fuelLevel: document.getElementById('fuelLevel'),
    earnings: document.getElementById('earnings'),
    timeRemaining: document.getElementById('timeRemaining'),
    ridesCount: document.getElementById('ridesCount'),
    toggleRules: document.getElementById('toggleRules'),
    quickRules: document.getElementById('quickRules'),
    waitingState: document.getElementById('waitingState'),
    rideRequest: document.getElementById('rideRequest'),
    drivingState: document.getElementById('drivingState'),
    passengerInteraction: document.getElementById('passengerInteraction'),
    inventoryModal: document.getElementById('inventoryModal'),
    checkInventoryBtn: document.getElementById('checkInventoryBtn'),
    needFuelBtn: document.getElementById('needFuelBtn'),
    closeInventory: document.getElementById('closeInventory'),
    inventoryItems: document.getElementById('inventoryItems'),
    acceptRideBtn: document.getElementById('acceptRideBtn'),
    declineRideBtn: document.getElementById('declineRideBtn'),
    restartBtn: document.getElementById('restartBtn'),
    nextShiftBtn: document.getElementById('nextShiftBtn')
  };

  // Event Listeners
  gameElements.startGameBtn.addEventListener('click', () => {
    generateShiftRules();
    displayShiftRules();
    displayQuickRules();
    showScreen('briefing');
  });

  gameElements.startShiftBtn.addEventListener('click', () => {
    showScreen('game');
    updateStatusBar();
    showGameState('waitingState');
    
    // Start first ride request after delay
    setTimeout(() => {
      showRideRequest();
    }, 2000 + Math.random() * 3000);
  });

  gameElements.toggleRules.addEventListener('click', () => {
    gameElements.quickRules.classList.toggle('hidden');
  });

  gameElements.checkInventoryBtn.addEventListener('click', () => {
    showInventory();
  });

  gameElements.needFuelBtn.addEventListener('click', () => {
    if (gameState.earnings >= 25) {
      gameState.fuel = Math.min(100, gameState.fuel + 50);
      gameState.earnings -= 25;
      gameState.timeRemaining -= 15;
      updateStatusBar();
    } else {
      alert("Not enough money for fuel!");
    }
  });

  gameElements.closeInventory.addEventListener('click', () => {
    gameElements.inventoryModal.classList.add('hidden');
  });

  gameElements.acceptRideBtn.addEventListener('click', acceptRide);

  gameElements.declineRideBtn.addEventListener('click', () => {
    // Small penalty for declining
    gameState.timeRemaining -= 5;
    updateStatusBar();
    
    // Go back to waiting
    setTimeout(() => {
      showRideRequest();
    }, 1000 + Math.random() * 2000);
  });

  gameElements.restartBtn.addEventListener('click', () => {
    resetGame();
    showScreen('loading');
  });

  gameElements.nextShiftBtn.addEventListener('click', () => {
    resetGame();
    generateShiftRules();
    displayShiftRules();
    displayQuickRules();
    showScreen('briefing');
  });

  // Close modal when clicking backdrop
  gameElements.inventoryModal.addEventListener('click', (e) => {
    if (e.target === gameElements.inventoryModal || e.target.classList.contains('modal-backdrop')) {
      gameElements.inventoryModal.classList.add('hidden');
    }
  });

  // Game timer - simplified to avoid timing issues in testing
  let gameTimer = setInterval(() => {
    if (gameState.currentScreen === 'game' && gameState.timeRemaining > 0) {
      gameState.timeRemaining -= 1;
      updateStatusBar();
      
      if (gameState.timeRemaining <= 0) {
        endShift(false);
      }
    }
  }, 30000); // Slower timer for testing

  // Initialize game state
  updateStatusBar();
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializeGame);