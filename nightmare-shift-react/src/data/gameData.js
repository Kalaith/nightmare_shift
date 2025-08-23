// Complete game data including rules, passengers, and locations
export const gameData = {
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
          duration: 3
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