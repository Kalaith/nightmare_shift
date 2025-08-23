import { useState, useEffect } from 'react'
import './App.css'

// Game Data
const gameData = {
  shift_rules: [
    // Basic rules (always visible)
    {
      id: 1,
      title: "No Eye Contact",
      description: "Do not look directly at passengers tonight",
      difficulty: "medium",
      type: "basic",
      visible: true
    },
    {
      id: 2, 
      title: "Silent Night",
      description: "No radio or music allowed during rides",
      difficulty: "easy",
      type: "basic",
      visible: true
    },
    {
      id: 3,
      title: "Cash Only",
      description: "Do not accept tips of any kind tonight",
      difficulty: "hard",
      type: "basic",
      visible: true
    },
    {
      id: 4,
      title: "Windows Sealed",
      description: "Keep all windows closed at all times",
      difficulty: "medium",
      type: "basic",
      visible: true
    },
    {
      id: 5,
      title: "Route Restriction",
      description: "Do not deviate from GPS route for any reason",
      difficulty: "hard",
      type: "basic",
      visible: true
    },
    
    // Conditional rules (only apply in certain situations)
    {
      id: 6,
      title: "Midnight Curfew",
      description: "No pickups after midnight from cemetery locations",
      difficulty: "medium",
      type: "conditional",
      condition: (gameState, passenger) => {
        const currentHour = 24 - Math.floor(gameState.timeRemaining / 60);
        return currentHour >= 0 && passenger?.pickup?.includes("Cemetery");
      },
      conditionHint: "Only applies to cemetery pickups after midnight",
      visible: true
    },
    {
      id: 7,
      title: "Living Passengers Only",
      description: "Do not transport supernatural entities during thunderstorms",
      difficulty: "hard",
      type: "conditional",
      condition: (gameState, passenger) => {
        return gameState.weather === 'storm' && passenger?.supernatural;
      },
      conditionHint: "Only during storms with supernatural passengers",
      visible: true
    },
    {
      id: 8,
      title: "Hospital Protocol",
      description: "Medical personnel must exit at original pickup location",
      difficulty: "medium",
      type: "conditional",
      condition: (gameState, passenger) => {
        return passenger?.photo === "👩‍⚕️" || passenger?.photo === "👨‍⚕️";
      },
      conditionHint: "Only applies to medical personnel",
      visible: true
    },
    
    // Conflicting rules (create impossible situations)
    {
      id: 9,
      title: "Emergency Response",
      description: "Always take the fastest route when passenger is in distress",
      difficulty: "hard",
      type: "conflicting",
      conflictsWith: [5], // Conflicts with Route Restriction
      visible: true
    },
    {
      id: 10,
      title: "Customer Service",
      description: "Always comply with reasonable passenger requests",
      difficulty: "medium",
      type: "conflicting",
      conflictsWith: [4], // Conflicts with Windows Sealed
      visible: true
    },
    {
      id: 11,
      title: "Safety First",
      description: "Make eye contact with passengers to ensure they're alert",
      difficulty: "hard",
      type: "conflicting",
      conflictsWith: [1], // Conflicts with No Eye Contact
      visible: true
    },
    
    // Hidden rules (not shown until violated)
    {
      id: 12,
      title: "The Counting Rule",
      description: "Never pick up more than 3 passengers with the same supernatural type",
      difficulty: "expert",
      type: "hidden",
      visible: false,
      violationMessage: "You've transported too many of the same supernatural entities. They're drawn to patterns...",
      checkViolation: (gameState) => {
        const supernaturalCounts = {};
        gameState.completedRides?.forEach(ride => {
          if (ride.passenger?.supernatural) {
            const type = ride.passenger.supernatural.split(' ')[0]; // Get first word
            supernaturalCounts[type] = (supernaturalCounts[type] || 0) + 1;
          }
        });
        return Object.values(supernaturalCounts).some(count => count > 3);
      }
    },
    {
      id: 13,
      title: "The Time Limit",
      description: "No single ride should take longer than 45 minutes",
      difficulty: "expert",
      type: "hidden",
      visible: false,
      violationMessage: "You took too long with that passenger. Time has consequences in this job...",
      checkViolation: (gameState) => {
        return gameState.currentRideDuration > 45;
      }
    },
    {
      id: 14,
      title: "The Silence Between",
      description: "Never speak during the last 5 minutes of your shift",
      difficulty: "expert",
      type: "hidden",
      visible: false,
      violationMessage: "Words spoken in the final moments carry too much weight. You should have stayed quiet...",
      checkViolation: (gameState) => {
        return gameState.timeRemaining <= 5 && gameState.spokeRecentlu;
      }
    }
  ],
  passengers: [
    // Original passengers
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
      rarity: "common",
      items: ["old locket", "withered flowers"],
      dialogue: ["It's so cold tonight, isn't it?", "I haven't been home in so long...", "Thank you for the ride, dear"],
      relationships: [],
      backstoryUnlocked: false,
      backstoryDetails: "Mrs. Chen was a regular taxi passenger for 40 years before her accident on this very route..."
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
      rarity: "common",
      items: ["strange coins", "business card with no company name"],
      dialogue: ["Working late again...", "Do you mind if I keep the windows up?", "Some jobs you just can't talk about"],
      relationships: [4],
      backstoryUnlocked: false,
      backstoryDetails: "Jake works the night shift at a blood bank, though his employment records don't seem to exist..."
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
      rarity: "common",
      items: ["muddy branch", "torn fabric", "cash with soil on it"],
      dialogue: ["I need to get back to civilization", "Stay away from the woods tonight", "They might still be following"],
      relationships: [8],
      backstoryUnlocked: false,
      backstoryDetails: "Sarah was part of a hiking group that went missing three years ago. She was the only one who 'returned'..."
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
      rarity: "uncommon",
      items: ["antique syringe", "prescription pad", "surgical tools"],
      dialogue: ["House calls are so rare these days", "I can help with any pain you're feeling", "Medicine has come so far since my day"],
      relationships: [2, 9],
      backstoryUnlocked: false,
      backstoryDetails: "Dr. Hollow lost his license in 1987 for conducting unauthorized experiments on terminal patients..."
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
      rarity: "rare",
      items: ["crystal pendant", "ancient coin", "contract paper"],
      dialogue: ["I see you have interesting items", "Everything has a price", "I make excellent deals"],
      relationships: [11, 16],
      backstoryUnlocked: false,
      backstoryDetails: "The Collector has been making deals in this city for over a century, always offering what people need most...",
      ruleModification: {
        canModify: true,
        type: "remove_rule",
        description: "Can remove one rule in exchange for a terrible price"
      }
    },
    // New passengers
    {
      id: 6,
      name: "Tommy Sullivan",
      photo: "👦",
      description: "Child in school uniform, shouldn't be out this late",
      pickup: "Elementary School",
      destination: "Suburban House",
      personalRule: "Don't ask about his parents - becomes very quiet",
      supernatural: "Lost child who doesn't realize he's been missing for decades",
      fare: 12,
      rarity: "common",
      items: ["torn homework", "old lunch box", "class photo"],
      dialogue: ["Is mommy waiting for me?", "I don't like the dark", "Teacher said I should go straight home"],
      relationships: [],
      backstoryUnlocked: false,
      backstoryDetails: "Tommy went missing from school in 1982. His backpack was found, but he never was..."
    },
    {
      id: 7,
      name: "Elena Vasquez",
      photo: "💃",
      description: "Dancer in vintage dress, speaks with old accent",
      pickup: "Old Theater District",
      destination: "Downtown Hotel",
      personalRule: "Requests specific songs - humming along will break silence rule",
      supernatural: "1940s nightclub performer who died in a fire",
      fare: 30,
      rarity: "uncommon",
      items: ["vintage lipstick", "burned dance card", "pearl necklace"],
      dialogue: ["The music never stops playing in my head", "I had the most wonderful audition tonight", "Do you know any Glenn Miller?"],
      relationships: [12],
      backstoryUnlocked: false,
      backstoryDetails: "Elena was the star performer at the Moonlight Club before the fire of 1943 claimed 30 lives..."
    },
    {
      id: 8,
      name: "Marcus Thompson",
      photo: "🏃‍♂️",
      description: "Jogger in athletic gear, constantly looking over shoulder",
      pickup: "Forest Road",
      destination: "Police Station",
      personalRule: "Keeps asking you to drive faster - accepting will violate route rules",
      supernatural: "Runner who encountered something supernatural in the woods",
      fare: 20,
      rarity: "common",
      items: ["torn running shoe", "strange claw marks on clothes", "broken GPS watch"],
      dialogue: ["Did you see that behind us?", "We need to go faster!", "I should have listened to the locals"],
      relationships: [3],
      backstoryUnlocked: false,
      backstoryDetails: "Marcus was training for a marathon when he took a wrong turn into the old growth forest..."
    },
    {
      id: 9,
      name: "Nurse Catherine",
      photo: "👩‍⚕️",
      description: "Hospital nurse in stained scrubs, very tired",
      pickup: "General Hospital",
      destination: "Abandoned Hospital",
      personalRule: "Will offer to check your pulse - accepting triggers medical rule violation",
      supernatural: "Overworked nurse who made a fatal mistake",
      fare: 25,
      rarity: "common",
      items: ["medical clipboard", "broken stethoscope", "guilt-stained badge"],
      dialogue: ["Another long shift ending", "Some mistakes you can never take back", "The patients keep calling my name"],
      relationships: [4],
      backstoryUnlocked: false,
      backstoryDetails: "Catherine accidentally administered the wrong medication to a patient during a 36-hour shift..."
    },
    {
      id: 10,
      name: "Old Pete",
      photo: "🎣",
      description: "Fisherman with wet clothes despite no rain",
      pickup: "Harbor District",
      destination: "Riverside Cemetery",
      personalRule: "Insists on keeping windows down - conflicts with sealed windows rule",
      supernatural: "Drowned fisherman who refuses to accept his fate",
      fare: 18,
      rarity: "common",
      items: ["rusty fishing hook", "waterlogged wallet", "boat registration"],
      dialogue: ["The fish are really biting tonight", "Haven't seen water this calm in years", "My boat's just around the corner"],
      relationships: [1],
      backstoryUnlocked: false,
      backstoryDetails: "Pete's boat was found capsized during a storm in 1995, but his body was never recovered..."
    },
    {
      id: 11,
      name: "Madame Zelda",
      photo: "🔮",
      description: "Fortune teller with knowing eyes and crystal jewelry",
      pickup: "Psychic Shop",
      destination: "Private Residence",
      personalRule: "Will read your future - listening reveals upcoming rule violations",
      supernatural: "Psychic who sees too much of what's coming",
      fare: 40,
      rarity: "rare",
      items: ["tarot cards", "crystal ball", "prophetic writings"],
      dialogue: ["I see danger in your immediate future", "The cards never lie about tonight", "Some knowledge comes with a price"],
      relationships: [5, 16],
      backstoryUnlocked: false,
      backstoryDetails: "Zelda's predictions are always accurate, but her clients rarely survive long enough to appreciate her gift...",
      ruleModification: {
        canModify: true,
        type: "reveal_hidden",
        description: "Reveals one hidden rule to the player"
      }
    },
    {
      id: 12,
      name: "Frank the Pianist",
      photo: "🎹",
      description: "Well-dressed musician with bandaged hands",
      pickup: "Old Theater District",
      destination: "Music Hall",
      personalRule: "Hums haunting melodies - will test your no music rule",
      supernatural: "Jazz musician who made a deal for talent",
      fare: 32,
      rarity: "uncommon",
      items: ["sheet music", "bloody piano keys", "devil's contract"],
      dialogue: ["Music is everything to me", "I'd give anything to play again", "Some contracts last forever"],
      relationships: [7],
      backstoryUnlocked: false,
      backstoryDetails: "Frank sold his soul for incredible musical talent, but the devil's price was higher than expected..."
    },
    {
      id: 13,
      name: "Sister Agnes",
      photo: "👩‍🔬",
      description: "Nun with ancient texts and worried expression",
      pickup: "Old Cathedral",
      destination: "Seminary",
      personalRule: "Offers to bless your car - accepting may conflict with supernatural passengers",
      supernatural: "Nun investigating supernatural occurrences in the city",
      fare: 20,
      rarity: "uncommon",
      items: ["holy water", "ancient tome", "blessed rosary"],
      dialogue: ["Evil walks freely tonight", "Faith is our only protection", "Some souls cannot be saved"],
      relationships: [],
      backstoryUnlocked: false,
      backstoryDetails: "Sister Agnes is one of the few living people who knows the truth about the city's supernatural residents..."
    },
    {
      id: 14,
      name: "Detective Morrison",
      photo: "🕵️‍♂️",
      description: "Tired detective with case files and coffee stains",
      pickup: "Police Station",
      destination: "Crime Scene",
      personalRule: "Asks probing questions about other passengers - answering reveals rule violations",
      supernatural: "Living detective investigating supernatural crimes",
      fare: 35,
      rarity: "rare",
      items: ["case files", "crime scene photos", "detective badge"],
      dialogue: ["Strange things happen on the night shift", "I've seen some unexplainable cases", "Every taxi driver has stories"],
      relationships: [8],
      backstoryUnlocked: false,
      backstoryDetails: "Detective Morrison specializes in cases other officers won't touch - missing persons who were never really missing..."
    },
    {
      id: 15,
      name: "The Midnight Mayor",
      photo: "🎩",
      description: "Impossibly tall figure in formal attire from another era",
      pickup: "City Hall",
      destination: "Private Estate",
      personalRule: "Commands you to break specific rules - obeying leads to immediate consequences",
      supernatural: "Ancient entity that governs the supernatural side of the city",
      fare: 100,
      rarity: "legendary",
      items: ["mayoral seal", "ancient key", "binding contract"],
      dialogue: ["Welcome to my city", "Rules are made to serve those who matter", "Your compliance is... appreciated"],
      relationships: [5, 11, 16],
      backstoryUnlocked: false,
      backstoryDetails: "The Midnight Mayor has ruled the supernatural side of the city since its founding, making deals and collecting debts...",
      ruleModification: {
        canModify: true,
        type: "add_temporary",
        newRule: {
          id: 99,
          title: "Mayor's Decree",
          description: "Follow all commands from city officials without question",
          difficulty: "nightmare",
          temporary: true,
          duration: 3 // applies for 3 rides
        }
      }
    },
    {
      id: 16,
      name: "Death's Taxi Driver",
      photo: "☠️",
      description: "Figure in dark robes who speaks in whispers",
      pickup: "Crossroads",
      destination: "End of the Line",
      personalRule: "Offers to trade places with you - accepting ends the game immediately",
      supernatural: "The reaper who collects souls of failed night shift drivers",
      fare: 0,
      rarity: "legendary",
      items: ["list of names", "hourglass", "scythe pendant"],
      dialogue: ["Your shift is almost over", "Every driver meets me eventually", "Some debts can only be paid with time"],
      relationships: [5, 11, 15],
      backstoryUnlocked: false,
      backstoryDetails: "The previous night shift taxi driver, who failed the rules one too many times and now serves as death's chauffeur..."
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
    },
    // New locations for expanded passenger pool
    {
      name: "Elementary School",
      description: "Empty playground with swings moving in windless air",
      atmosphere: "Childhood terror"
    },
    {
      name: "Suburban House",
      description: "Cookie-cutter homes with too-perfect lawns",
      atmosphere: "False normalcy"
    },
    {
      name: "Old Theater District",
      description: "Faded marquees and darkened stage doors",
      atmosphere: "Forgotten glamour"
    },
    {
      name: "Downtown Hotel",
      description: "Art deco lobby with no guests at the desk",
      atmosphere: "Transient luxury"
    },
    {
      name: "Police Station",
      description: "Harsh fluorescent lights and barred windows",
      atmosphere: "Institutional authority"
    },
    {
      name: "General Hospital",
      description: "Sterile corridors echoing with distant footsteps",
      atmosphere: "Clinical dread"
    },
    {
      name: "Harbor District",
      description: "Fog-shrouded docks with creaking piers",
      atmosphere: "Maritime mystery"
    },
    {
      name: "Psychic Shop",
      description: "Neon palm reader sign buzzing in the window",
      atmosphere: "Occult commerce"
    },
    {
      name: "Music Hall",
      description: "Grand concert hall with dust motes dancing in spotlight",
      atmosphere: "Haunted artistry"
    },
    {
      name: "Old Cathedral",
      description: "Gothic spires piercing the night sky",
      atmosphere: "Sacred sanctuary"
    },
    {
      name: "Seminary",
      description: "Ivy-covered religious institution with glowing windows",
      atmosphere: "Theological study"
    },
    {
      name: "Crime Scene",
      description: "Yellow tape fluttering around chalk outlines",
      atmosphere: "Recent violence"
    },
    {
      name: "City Hall",
      description: "Imposing government building with marble columns",
      atmosphere: "Municipal power"
    },
    {
      name: "Private Estate",
      description: "Gated mansion hidden behind ancient oak trees",
      atmosphere: "Exclusive mystery"
    },
    {
      name: "Private Residence",
      description: "Unremarkable house with secrets behind curtained windows",
      atmosphere: "Hidden darkness"
    },
    {
      name: "Antique Shop",
      description: "Cluttered storefront filled with objects from forgotten times",
      atmosphere: "Temporal commerce"
    },
    {
      name: "Crossroads",
      description: "Four paths meeting where streetlights fail to reach",
      atmosphere: "Decision point"
    },
    {
      name: "End of the Line",
      description: "The place where all journeys ultimately lead",
      atmosphere: "Final destination"
    }
  ]
};

// Local Storage Utilities
const STORAGE_KEYS = {
  PLAYER_STATS: 'nightshift_player_stats',
  LEADERBOARD: 'nightshift_leaderboard', 
  GAME_PREFERENCES: 'nightshift_preferences',
  UNLOCKED_BACKSTORIES: 'nightshift_backstories',
  SAVED_GAME: 'nightshift_saved_game'
};

const LocalStorage = {
  save: (key, data) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  },
  
  load: (key, defaultValue = null) => {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
      console.warn('Failed to load from localStorage:', error);
      return defaultValue;
    }
  },
  
  remove: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error);
    }
  }
};

// Initialize persistent data structures
const getDefaultPlayerStats = () => ({
  totalShiftsCompleted: 0,
  totalShiftsStarted: 0,
  totalRidesCompleted: 0,
  totalEarnings: 0,
  totalFuelUsed: 0,
  totalTimePlayedMinutes: 0,
  bestShiftEarnings: 0,
  bestShiftRides: 0,
  longestShiftMinutes: 0,
  passengersEncountered: new Set(),
  rulesViolatedHistory: [],
  backstoriesUnlocked: new Set(),
  legendaryPassengersEncountered: new Set(),
  achievementsUnlocked: new Set(),
  firstPlayDate: Date.now(),
  lastPlayDate: Date.now()
});

const getDefaultLeaderboard = () => ({
  topEarnings: [],      // Top 10 shifts by earnings
  topRides: [],         // Top 10 shifts by rides completed  
  topSurvivalTime: [],  // Top 10 shifts by time survived
  topOverall: []        // Top 10 shifts by combined score
});

function App() {
  // Initialize persistent data on app start
  const [playerStats, setPlayerStats] = useState(() => 
    LocalStorage.load(STORAGE_KEYS.PLAYER_STATS, getDefaultPlayerStats())
  );
  const [leaderboard, setLeaderboard] = useState(() => 
    LocalStorage.load(STORAGE_KEYS.LEADERBOARD, getDefaultLeaderboard())
  );
  
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
    usedPassengers: [],
    shiftStartTime: null,
    sessionStartTime: Date.now()
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

  // Generate advanced shift rules with difficulty scaling
  const generateShiftRules = () => {
    const playerExperience = (gameState.ridesCompleted || 0) + (gameState.shiftsCompleted || 0) * 10;
    const difficultyLevel = Math.min(4, Math.floor(playerExperience / 10)); // 0-4 difficulty levels
    
    // Get available rule pools based on difficulty
    const basicRules = gameData.shift_rules.filter(rule => rule.type === 'basic');
    const conditionalRules = gameData.shift_rules.filter(rule => rule.type === 'conditional');
    const conflictingRules = gameData.shift_rules.filter(rule => rule.type === 'conflicting');
    const hiddenRules = gameData.shift_rules.filter(rule => rule.type === 'hidden');
    
    let selectedRules = [];
    
    // Always include 2-3 basic rules
    const shuffledBasic = [...basicRules].sort(() => 0.5 - Math.random());
    selectedRules.push(...shuffledBasic.slice(0, 2 + Math.floor(Math.random() * 2)));
    
    // Add conditional rules based on difficulty
    if (difficultyLevel >= 1) {
      const shuffledConditional = [...conditionalRules].sort(() => 0.5 - Math.random());
      selectedRules.push(...shuffledConditional.slice(0, Math.floor(Math.random() * 2) + 1));
    }
    
    // Add conflicting rules at higher difficulty
    if (difficultyLevel >= 2) {
      const shuffledConflicting = [...conflictingRules].sort(() => 0.5 - Math.random());
      const conflictingRule = shuffledConflicting[0];
      
      // Check if we can add a conflicting rule (ensure we have the rule it conflicts with)
      if (conflictingRule && conflictingRule.conflictsWith.some(id => 
        selectedRules.some(rule => rule.id === id)
      )) {
        selectedRules.push(conflictingRule);
      }
    }
    
    // Add hidden rules at expert difficulty
    if (difficultyLevel >= 3) {
      const shuffledHidden = [...hiddenRules].sort(() => 0.5 - Math.random());
      selectedRules.push(...shuffledHidden.slice(0, Math.floor(Math.random() * 2) + 1));
    }
    
    // Store both visible and hidden rules separately
    const visibleRules = selectedRules.filter(rule => rule.visible);
    const hiddenActiveRules = selectedRules.filter(rule => !rule.visible);
    
    setGameState(prev => ({ 
      ...prev, 
      currentRules: visibleRules,
      hiddenRules: hiddenActiveRules,
      ruleConflicts: findRuleConflicts(selectedRules),
      difficultyLevel
    }));
  };
  
  // Helper function to identify rule conflicts
  const findRuleConflicts = (rules) => {
    const conflicts = [];
    rules.forEach(rule => {
      if (rule.conflictsWith) {
        rule.conflictsWith.forEach(conflictId => {
          const conflictingRule = rules.find(r => r.id === conflictId);
          if (conflictingRule) {
            conflicts.push({
              rule1: rule,
              rule2: conflictingRule,
              description: `"${rule.title}" conflicts with "${conflictingRule.title}"`
            });
          }
        });
      }
    });
    return conflicts;
  };
  
  // Check for hidden rule violations
  const checkHiddenRuleViolations = (gameState, passenger) => {
    const hiddenRules = gameState.hiddenRules || [];
    
    for (const rule of hiddenRules) {
      if (rule.checkViolation && rule.checkViolation(gameState)) {
        return { rule, violated: true };
      }
    }
    
    return null;
  };
  
  // Persistent data management
  const updatePlayerStats = (updates) => {
    setPlayerStats(prev => {
      const updated = { ...prev, ...updates, lastPlayDate: Date.now() };
      LocalStorage.save(STORAGE_KEYS.PLAYER_STATS, updated);
      return updated;
    });
  };
  
  const addToLeaderboard = (shiftData) => {
    setLeaderboard(prev => {
      const updated = { ...prev };
      
      // Calculate composite score
      const score = (shiftData.earnings * 0.4) + (shiftData.ridesCompleted * 20) + (shiftData.timeSpent * 0.1);
      const entry = { ...shiftData, score, timestamp: Date.now() };
      
      // Add to appropriate leaderboards (keep top 10)
      const addToBoard = (board, sortBy) => {
        const newBoard = [...board, entry].sort((a, b) => b[sortBy] - a[sortBy]).slice(0, 10);
        return newBoard;
      };
      
      updated.topEarnings = addToBoard(updated.topEarnings, 'earnings');
      updated.topRides = addToBoard(updated.topRides, 'ridesCompleted'); 
      updated.topSurvivalTime = addToBoard(updated.topSurvivalTime, 'timeSpent');
      updated.topOverall = addToBoard(updated.topOverall, 'score');
      
      LocalStorage.save(STORAGE_KEYS.LEADERBOARD, updated);
      return updated;
    });
  };
  
  // Save/Load Game State
  const saveGame = () => {
    if (gameState.currentScreen === 'game' && gameState.gamePhase !== 'waiting') {
      const saveData = {
        gameState: { ...gameState, sessionStartTime: Date.now() },
        playerStats,
        timestamp: Date.now(),
        version: '1.0'
      };
      LocalStorage.save(STORAGE_KEYS.SAVED_GAME, saveData);
      
      // Show save confirmation
      setGameState(prev => ({ 
        ...prev, 
        showSaveNotification: true 
      }));
      
      setTimeout(() => {
        setGameState(prev => ({ 
          ...prev, 
          showSaveNotification: false 
        }));
      }, 2000);
    }
  };
  
  const loadGame = () => {
    const saveData = LocalStorage.load(STORAGE_KEYS.SAVED_GAME);
    if (saveData && saveData.gameState) {
      setGameState(saveData.gameState);
      setPlayerStats(saveData.playerStats);
      showScreen('game');
    }
  };
  
  const hasSavedGame = () => {
    const saveData = LocalStorage.load(STORAGE_KEYS.SAVED_GAME);
    return saveData && saveData.gameState;
  };
  
  const deleteSavedGame = () => {
    LocalStorage.remove(STORAGE_KEYS.SAVED_GAME);
  };

  // Get random passenger with rarity weighting and relationship system
  const getRandomPassenger = () => {
    const availablePassengers = gameData.passengers.filter(p => !gameState.usedPassengers.includes(p.id));
    if (availablePassengers.length === 0) return null;
    
    // Check for relationship-based passenger spawning
    const lastPassenger = gameState.usedPassengers.length > 0 ? 
      gameData.passengers.find(p => p.id === gameState.usedPassengers[gameState.usedPassengers.length - 1]) : null;
    
    if (lastPassenger && lastPassenger.relationships.length > 0 && Math.random() < 0.3) {
      const relatedPassengers = availablePassengers.filter(p => 
        lastPassenger.relationships.includes(p.id)
      );
      if (relatedPassengers.length > 0) {
        const passenger = relatedPassengers[Math.floor(Math.random() * relatedPassengers.length)];
        setGameState(prev => ({ 
          ...prev, 
          usedPassengers: [...prev.usedPassengers, passenger.id],
          currentPassenger: passenger,
          relationshipTriggered: lastPassenger.id
        }));
        return passenger;
      }
    }
    
    // Rarity-based weighted selection
    const rarityWeights = {
      'common': 70,
      'uncommon': 25,
      'rare': 4.5,
      'legendary': 0.5
    };
    
    const weightedPassengers = [];
    availablePassengers.forEach(passenger => {
      const weight = rarityWeights[passenger.rarity] || 50;
      for (let i = 0; i < weight; i++) {
        weightedPassengers.push(passenger);
      }
    });
    
    const passenger = weightedPassengers[Math.floor(Math.random() * weightedPassengers.length)];
    
    // Check if backstory has been unlocked for this passenger
    const backstoryUnlocked = gameState.passengerBackstories?.[passenger.id] || false;
    
    setGameState(prev => ({ 
      ...prev, 
      usedPassengers: [...prev.usedPassengers, passenger.id],
      currentPassenger: { ...passenger, backstoryUnlocked },
      relationshipTriggered: null
    }));
    return { ...passenger, backstoryUnlocked };
  };

  // Game functions
  const startGame = () => {
    generateShiftRules();
    // Update player stats for shift started
    updatePlayerStats({ 
      totalShiftsStarted: playerStats.totalShiftsStarted + 1 
    });
    showScreen('briefing');
  };

  const startShift = () => {
    showScreen('game');
    setGameState(prev => ({ 
      ...prev, 
      gamePhase: 'waiting',
      shiftStartTime: Date.now()
    }));
    
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
    
    // Check for backstory unlock (20% chance on first encounter, 50% on repeat encounters)
    const backstoryUnlockChance = gameState.usedPassengers.filter(id => id === passenger.id).length > 1 ? 0.5 : 0.2;
    const unlockBackstory = Math.random() < backstoryUnlockChance;
    
    // Check for hidden rule violations BEFORE updating state
    const hiddenRuleViolation = checkHiddenRuleViolations(gameState, passenger);
    
    if (hiddenRuleViolation) {
      // Reveal the hidden rule and trigger game over
      setGameState(prev => ({
        ...prev,
        revealedHiddenRules: [...(prev.revealedHiddenRules || []), hiddenRuleViolation.rule]
      }));
      
      setTimeout(() => {
        gameOver(hiddenRuleViolation.rule.violationMessage);
      }, 1000);
      return;
    }
    
    setGameState(prev => ({ 
      ...prev, 
      earnings: prev.earnings + passenger.fare,
      ridesCompleted: prev.ridesCompleted + 1,
      inventory: [...prev.inventory, ...passenger.items.map(item => ({
        name: item,
        source: passenger.name,
        backstoryItem: unlockBackstory
      }))],
      gamePhase: 'waiting',
      // Track completed rides for hidden rule checking
      completedRides: [...(prev.completedRides || []), {
        passenger,
        duration: prev.currentRideDuration || 0,
        timestamp: Date.now()
      }],
      currentRideDuration: 0,
      // Update passenger data with backstory unlock
      passengerBackstories: unlockBackstory ? 
        {...(prev.passengerBackstories || {}), [passenger.id]: true} : 
        prev.passengerBackstories
    }));
    
    // Show backstory notification if unlocked
    if (unlockBackstory) {
      setTimeout(() => {
        setGameState(prev => ({
          ...prev,
          showBackstoryNotification: {
            passenger: passenger.name,
            backstory: passenger.backstoryDetails
          }
        }));
      }, 1500);
    }
    
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
    const shiftEndTime = Date.now();
    const shiftDuration = gameState.shiftStartTime ? 
      Math.round((shiftEndTime - gameState.shiftStartTime) / (1000 * 60)) : 0;
    
    // Prepare shift data for leaderboard
    const shiftData = {
      earnings: gameState.earnings,
      ridesCompleted: gameState.ridesCompleted,
      timeSpent: shiftDuration,
      successful,
      rulesViolated: gameState.rulesViolated || 0,
      passengersEncountered: gameState.usedPassengers.length,
      difficultyLevel: gameState.difficultyLevel || 0
    };
    
    if (successful) {
      const survivalBonus = 50;
      const finalEarnings = gameState.earnings + survivalBonus;
      
      setGameState(prev => ({ 
        ...prev, 
        earnings: finalEarnings,
        survivalBonus
      }));
      
      // Update stats for successful shift
      updatePlayerStats({
        totalShiftsCompleted: playerStats.totalShiftsCompleted + 1,
        totalRidesCompleted: playerStats.totalRidesCompleted + gameState.ridesCompleted,
        totalEarnings: playerStats.totalEarnings + finalEarnings,
        bestShiftEarnings: Math.max(playerStats.bestShiftEarnings, finalEarnings),
        bestShiftRides: Math.max(playerStats.bestShiftRides, gameState.ridesCompleted),
        longestShiftMinutes: Math.max(playerStats.longestShiftMinutes, shiftDuration),
        totalTimePlayedMinutes: playerStats.totalTimePlayedMinutes + shiftDuration
      });
      
      // Add to leaderboard
      addToLeaderboard({ ...shiftData, earnings: finalEarnings });
      
      // Clear saved game on successful completion
      deleteSavedGame();
      
      showScreen('success');
    } else {
      // Update stats for failed shift  
      updatePlayerStats({
        totalTimePlayedMinutes: playerStats.totalTimePlayedMinutes + shiftDuration,
        totalRidesCompleted: playerStats.totalRidesCompleted + gameState.ridesCompleted,
        totalEarnings: playerStats.totalEarnings + gameState.earnings
      });
      
      // Still add failed shifts to leaderboard
      addToLeaderboard(shiftData);
      
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
      
      {/* Player Stats Summary */}
      <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 mb-6">
        <h3 className="text-teal-300 text-lg mb-3">Driver Record</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Shifts Completed:</span>
            <span className="text-gray-200">{playerStats.totalShiftsCompleted}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Total Earnings:</span>
            <span className="text-gray-200">${playerStats.totalEarnings}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Best Shift:</span>
            <span className="text-gray-200">${playerStats.bestShiftEarnings}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Max Rides:</span>
            <span className="text-gray-200">{playerStats.bestShiftRides}</span>
          </div>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col justify-center items-center gap-6">
        <div className="w-15 h-15 border-3 border-gray-600 border-t-teal-300 rounded-full animate-spin"></div>
        <p className="text-gray-200">Connecting to dispatch...</p>
      </div>
      
      <div className="space-y-3">
        <button 
          onClick={startGame}
          className="w-full bg-teal-300 text-gray-800 py-3 px-5 rounded-lg text-lg font-medium hover:bg-teal-400 transition-colors"
        >
          Start New Shift
        </button>
        
        {hasSavedGame() && (
          <button 
            onClick={loadGame}
            className="w-full bg-green-600 text-white py-3 px-5 rounded-lg text-lg font-medium hover:bg-green-500 transition-colors"
          >
            💾 Continue Saved Shift
          </button>
        )}
        
        <button 
          onClick={() => showScreen('leaderboard')}
          className="w-full bg-gray-700 text-gray-200 py-2 px-5 rounded-lg text-sm hover:bg-gray-600 transition-colors"
        >
          📊 View Leaderboard
        </button>
      </div>
    </div>
  );

  // Leaderboard Screen Component
  const LeaderboardScreen = () => {
    const [activeTab, setActiveTab] = useState('earnings');
    
    const getLeaderboardData = () => {
      switch (activeTab) {
        case 'earnings': return leaderboard.topEarnings;
        case 'rides': return leaderboard.topRides;
        case 'survival': return leaderboard.topSurvivalTime;
        case 'overall': return leaderboard.topOverall;
        default: return [];
      }
    };
    
    const formatDate = (timestamp) => {
      return new Date(timestamp).toLocaleDateString();
    };
    
    return (
      <div className="min-h-screen p-5 flex flex-col bg-gradient-to-b from-gray-800 to-slate-900">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-semibold text-teal-300 mb-2">🏆 Night Shift Leaderboard</h2>
          <p className="text-gray-300">Top performing drivers in the supernatural district</p>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex space-x-2 mb-6 bg-gray-800 p-2 rounded-lg">
          {[
            { key: 'earnings', label: 'Top Earnings', icon: '💰' },
            { key: 'rides', label: 'Most Rides', icon: '🚗' },
            { key: 'survival', label: 'Longest Shifts', icon: '🕐' },
            { key: 'overall', label: 'Best Overall', icon: '⭐' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                activeTab === tab.key 
                  ? 'bg-teal-300 text-gray-800' 
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
              }`}
            >
              <span className="mr-1">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
        
        {/* Leaderboard Content */}
        <div className="flex-1 mb-6">
          <div className="bg-gray-800 border border-gray-600 rounded-lg overflow-hidden">
            {getLeaderboardData().length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <p className="text-4xl mb-4">👻</p>
                <p>No shifts completed yet...</p>
                <p className="text-sm">Complete a shift to see your scores here!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-700">
                {getLeaderboardData().map((entry, index) => (
                  <div key={index} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        index === 0 ? 'bg-yellow-400 text-gray-900' :
                        index === 1 ? 'bg-gray-400 text-gray-900' :
                        index === 2 ? 'bg-orange-400 text-gray-900' :
                        'bg-gray-700 text-gray-300'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="text-gray-200 font-medium">
                          {activeTab === 'earnings' && `$${entry.earnings}`}
                          {activeTab === 'rides' && `${entry.ridesCompleted} rides`}
                          {activeTab === 'survival' && `${entry.timeSpent} minutes`}
                          {activeTab === 'overall' && `${Math.round(entry.score)} points`}
                        </div>
                        <div className="text-gray-400 text-sm">
                          {entry.successful ? '✅ Survived' : '💀 Failed'} • 
                          Difficulty {entry.difficultyLevel || 0} • 
                          {formatDate(entry.timestamp)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-400">
                      <div>${entry.earnings} • {entry.ridesCompleted} rides</div>
                      <div>{entry.timeSpent}min • {entry.rulesViolated || 0} violations</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Back Button */}
        <button 
          onClick={() => showScreen('loading')}
          className="w-full bg-gray-700 text-gray-200 py-3 px-5 rounded-lg font-medium hover:bg-gray-600 transition-colors"
        >
          ← Back to Menu
        </button>
      </div>
    );
  };

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
            <div key={rule.id} className={`bg-gray-800 border rounded-lg p-5 shadow-md ${
              rule.type === 'conditional' ? 'border-yellow-400/50' :
              rule.type === 'conflicting' ? 'border-red-400/50' :
              'border-gray-600'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <div className="text-xl font-semibold text-teal-300">{rule.title}</div>
                {rule.type === 'conditional' && <span className="text-yellow-400 text-sm">CONDITIONAL</span>}
                {rule.type === 'conflicting' && <span className="text-red-400 text-sm">CONFLICTING</span>}
              </div>
              <p className="text-gray-200 mb-2">{rule.description}</p>
              {rule.conditionHint && (
                <p className="text-yellow-400 text-sm italic">• {rule.conditionHint}</p>
              )}
            </div>
          ))}
          
          {/* Show rule conflicts */}
          {gameState.ruleConflicts && gameState.ruleConflicts.length > 0 && (
            <div className="bg-red-400/10 border border-red-400/30 rounded-lg p-4 mt-4">
              <h4 className="text-red-400 font-semibold mb-2">⚠️ Rule Conflicts Detected:</h4>
              {gameState.ruleConflicts.map((conflict, index) => (
                <p key={index} className="text-red-300 text-sm mb-1">
                  • {conflict.description}
                </p>
              ))}
              <p className="text-red-400 text-sm mt-2 italic">
                You must choose which rule to follow when conflicts arise...
              </p>
            </div>
          )}
          
          {/* Show difficulty level */}
          <div className="text-center mt-4">
            <span className="text-gray-400 text-sm">
              Difficulty Level: {gameState.difficultyLevel || 0}/4
              {gameState.hiddenRules && gameState.hiddenRules.length > 0 && 
                ` • ${gameState.hiddenRules.length} hidden rule(s) active`
              }
            </span>
          </div>
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
                {gameState.currentRules.map((rule, index) => (
                  <div key={rule.id} className="text-sm text-gray-300 mb-2 last:mb-0">
                    • {rule.description}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Save Game Button */}
          <button 
            onClick={saveGame}
            className="bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-500 transition-colors"
          >
            💾 Save
          </button>
        </div>
        
        {/* End Shift Early Button */}
        <button 
          onClick={() => {
            const confirm = window.confirm("Are you sure you want to end your shift early? This will count as a failed shift.");
            if (confirm) {
              endShift(false);
            }
          }}
          className="bg-red-600 text-white py-2 px-4 rounded-lg text-sm hover:bg-red-500 transition-colors"
        >
          ⏹️ End Shift Early
        </button>
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
      
      {/* Backstory Notification Modal */}
      {gameState.showBackstoryNotification && <BackstoryNotificationModal />}
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
      
      // New passenger-specific interactions
      if (passenger.id === 6) { // Tommy Sullivan
        choices.push({
          text: "Ask him why he's out so late",
          dangerous: true,
          action: () => gameOver("Tommy's eyes went completely black. 'I've been waiting for someone to ask...' were the last words you heard.")
        });
      }
      
      if (passenger.id === 7) { // Elena Vasquez
        const silentRule = gameState.currentRules.find(rule => rule.id === 2);
        if (silentRule) {
          choices.push({
            text: "Hum along to her song",
            dangerous: true,
            action: () => gameOver("Your humming broke the silence rule, but Elena's song never ended... and neither will yours.")
          });
        }
      }
      
      if (passenger.id === 10) { // Old Pete
        const windowsRule = gameState.currentRules.find(rule => rule.id === 4);
        if (windowsRule) {
          choices.push({
            text: "Roll down the windows as he requests",
            dangerous: true,
            action: () => gameOver("The smell of the harbor flooded in... along with something much worse than seawater.")
          });
        }
      }
      
      if (passenger.id === 11) { // Madame Zelda
        choices.push({
          text: "Listen to her fortune about your future",
          dangerous: true,
          action: () => gameOver("She told you exactly how this ride would end. Knowledge of your fate made it impossible to avoid.")
        });
      }
      
      if (passenger.id === 13) { // Sister Agnes
        choices.push({
          text: "Accept her blessing for your car",
          risky: true,
          action: () => {
            if (gameState.currentPassenger && gameState.currentPassenger.rarity === 'legendary') {
              gameOver("The blessing reacted violently with your other passenger. Holy wars have casualties...");
            } else {
              continueToDestination();
            }
          }
        });
      }
      
      if (passenger.id === 14) { // Detective Morrison
        choices.push({
          text: "Tell him about your other passengers",
          dangerous: true,
          action: () => gameOver("The detective's questions never stopped. Some investigations are better left unsolved.")
        });
      }
      
      // RULE MODIFICATION MECHANICS
      if (passenger.ruleModification?.canModify) {
        if (passenger.id === 15) { // The Midnight Mayor - adds temporary rule
          choices.push({
            text: "Accept his decree to add a new rule",
            legendary: true,
            action: () => {
              setGameState(prev => ({ 
                ...prev,
                temporaryRules: [...(prev.temporaryRules || []), passenger.ruleModification.newRule],
                earnings: prev.earnings + 200
              }));
              continueToDestination();
            }
          });
        }
        
        if (passenger.id === 11) { // Madame Zelda - reveals hidden rule
          choices.push({
            text: "Ask her to reveal what you don't know",
            action: () => {
              const hiddenRule = gameState.hiddenRules?.[0];
              if (hiddenRule) {
                setGameState(prev => ({ 
                  ...prev,
                  currentRules: [...prev.currentRules, hiddenRule],
                  hiddenRules: prev.hiddenRules.filter(r => r.id !== hiddenRule.id),
                  revealedByZelda: true
                }));
              }
              continueToDestination();
            }
          });
        }
        
        if (passenger.id === 5) { // The Collector - removes rule for a price
          choices.push({
            text: "Ask him to remove one of your rules",
            action: () => {
              if (gameState.currentRules.length > 1) {
                const ruleToRemove = gameState.currentRules[Math.floor(Math.random() * gameState.currentRules.length)];
                setGameState(prev => ({ 
                  ...prev,
                  currentRules: prev.currentRules.filter(r => r.id !== ruleToRemove.id),
                  earnings: Math.max(0, prev.earnings - 100), // Collector's price
                  fuel: Math.max(10, prev.fuel - 25) // Additional cost
                }));
              }
              continueToDestination();
            }
          });
        }
      }

      // LEGENDARY PASSENGER MECHANICS
      if (passenger.id === 15) { // The Midnight Mayor
        choices.push({
          text: "Obey his command to break the no eye contact rule",
          legendary: true,
          action: () => gameOver("The Midnight Mayor's authority overrode your rules... and your survival instincts.")
        });
        
        choices.push({
          text: "Refuse his commands and follow the rules",
          legendary: true,
          action: () => {
            setGameState(prev => ({ 
              ...prev, 
              earnings: prev.earnings + 200,
              mayorsRespect: true
            }));
            continueToDestination();
          }
        });
      }
      
      if (passenger.id === 16) { // Death's Taxi Driver
        choices.push({
          text: "Accept his offer to trade places",
          legendary: true,
          action: () => gameOver("You are now the reaper's chauffeur. Your shift never ends, but neither does anyone else's.")
        });
        
        choices.push({
          text: "Decline and continue driving",
          legendary: true,
          action: () => {
            setGameState(prev => ({ 
              ...prev, 
              deathsRespect: true,
              timeRemaining: prev.timeRemaining + 120 // Death grants more time
            }));
            continueToDestination();
          }
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
              className="w-full bg-gray-800 border border-gray-600 rounded p-4 text-left text-gray-200 hover:bg-gray-700 hover:border-teal-300 transition-colors"
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

  // Backstory Notification Modal Component
  const BackstoryNotificationModal = () => {
    const notification = gameState.showBackstoryNotification;
    if (!notification) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
        <div className="absolute inset-0 bg-black/90"></div>
        <div className="bg-gray-800 border border-blue-400 rounded-lg max-w-lg w-full shadow-lg relative z-10 shadow-blue-400/30">
          <div className="flex justify-between items-center p-5 border-b border-blue-400/30">
            <h3 className="text-blue-400 text-xl flex items-center gap-2">
              <span>📜</span> Backstory Revealed
            </h3>
            <button 
              onClick={() => setGameState(prev => ({ ...prev, showBackstoryNotification: null }))}
              className="text-gray-400 hover:text-gray-200 text-3xl leading-none w-8 h-8 flex items-center justify-center"
            >
              ×
            </button>
          </div>
          <div className="p-5">
            <h4 className="text-teal-300 text-lg mb-3">{notification.passenger}</h4>
            <p className="text-gray-200 leading-relaxed mb-4">{notification.backstory}</p>
            <div className="text-center">
              <button 
                onClick={() => setGameState(prev => ({ ...prev, showBackstoryNotification: null }))}
                className="bg-blue-400 text-gray-800 py-2 px-4 rounded hover:bg-blue-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

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
        <div className="space-y-3">
          <button 
            onClick={() => {
              resetGame();
              showScreen('loading');
            }}
            className="w-full bg-teal-300 text-gray-800 py-3 px-5 rounded-lg text-lg font-medium hover:bg-teal-400 transition-colors"
          >
            Try Another Shift
          </button>
          <div className="flex gap-3">
            <button 
              onClick={() => showScreen('leaderboard')}
              className="flex-1 bg-gray-700 text-gray-200 py-2 px-4 rounded-lg text-sm hover:bg-gray-600 transition-colors"
            >
              📊 Leaderboard
            </button>
            <button 
              onClick={() => showScreen('loading')}
              className="flex-1 bg-gray-700 text-gray-200 py-2 px-4 rounded-lg text-sm hover:bg-gray-600 transition-colors"
            >
              🏠 Main Menu
            </button>
          </div>
        </div>
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
        <div className="space-y-3">
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
          <div className="flex gap-3">
            <button 
              onClick={() => showScreen('leaderboard')}
              className="flex-1 bg-gray-700 text-gray-200 py-2 px-4 rounded-lg text-sm hover:bg-gray-600 transition-colors"
            >
              📊 Leaderboard
            </button>
            <button 
              onClick={() => showScreen('loading')}
              className="flex-1 bg-gray-700 text-gray-200 py-2 px-4 rounded-lg text-sm hover:bg-gray-600 transition-colors"
            >
              🏠 Main Menu
            </button>
          </div>
        </div>
      </div>
    </div>
  );



  // Main render
  return (
    <div className="text-gray-200 bg-gray-800 min-h-screen">
      {gameState.currentScreen === 'loading' && <LoadingScreen />}
      {gameState.currentScreen === 'leaderboard' && <LeaderboardScreen />}
      {gameState.currentScreen === 'briefing' && <ShiftBriefingScreen />}
      {gameState.currentScreen === 'game' && <GameScreen />}
      {gameState.currentScreen === 'gameOver' && <GameOverScreen />}
      {gameState.currentScreen === 'success' && <SuccessScreen />}
      
      {/* Save Game Notification */}
      {gameState.showSaveNotification && (
        <div className="fixed top-4 right-4 bg-green-600 text-white py-2 px-4 rounded-lg shadow-lg z-50">
          💾 Game Saved!
        </div>
      )}
    </div>
  );
}

export default App;