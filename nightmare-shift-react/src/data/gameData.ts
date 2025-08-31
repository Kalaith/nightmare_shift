import type { GameData } from '../types/game';

// Complete game data including rules, passengers, and locations
export const gameData: GameData = {
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
      visible: true
    },
    {
      id: 7,
      title: "Living Passengers Only",
      description: "Do not transport supernatural entities during thunderstorms",
      difficulty: "hard",
      type: "conditional",
      visible: true
    },
    {
      id: 8,
      title: "Hospital Protocol",
      description: "Medical personnel must exit at original pickup location",
      difficulty: "medium",
      type: "conditional",
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
      violationMessage: "You've transported too many of the same supernatural entities. They're drawn to patterns..."
    },
    {
      id: 13,
      title: "The Time Limit",
      description: "No single ride should take longer than 45 minutes",
      difficulty: "expert",
      type: "hidden",
      visible: false,
      violationMessage: "You took too long with that passenger. Time has consequences in this job..."
    },
    {
      id: 14,
      title: "The Silence Between",
      description: "Never speak during the last 5 minutes of your shift",
      difficulty: "expert",
      type: "hidden",
      visible: false,
      violationMessage: "Words spoken in the final moments carry too much weight. You should have stayed quiet..."
    },

    // Weather-triggered rules (activated by weather conditions)
    {
      id: 101,
      title: "Storm Silence",
      description: "Don't use windshield wipers during thunderstorms",
      difficulty: "hard",
      type: "weather",
      visible: false,
      trigger: "thunderstorm",
      violationMessage: "The wipers disturbed something that feeds on electrical storms..."
    },
    {
      id: 102,
      title: "Light in Darkness",
      description: "Keep headlights on during heavy fog",
      difficulty: "medium",
      type: "weather",
      visible: false,
      trigger: "heavy_fog",
      violationMessage: "In the fog, darkness means something different. You should have kept the lights on."
    },
    {
      id: 103,
      title: "Winter Caution",
      description: "Drive under 25 mph in snow conditions",
      difficulty: "medium",
      type: "weather",
      visible: false,
      trigger: "snow",
      violationMessage: "Speed in snow conditions attracted the attention of winter spirits..."
    },
    {
      id: 104,
      title: "Shelter Protocol",
      description: "No stops during late night bad weather",
      difficulty: "hard",
      type: "weather",
      visible: false,
      trigger: "latenight_badweather",
      violationMessage: "Stopping in bad weather during the witching hour was a mistake..."
    },
    {
      id: 105,
      title: "Clear Sight",
      description: "Don't use air conditioning when visibility drops below 30%",
      difficulty: "medium",
      type: "weather",
      visible: false,
      trigger: "low_visibility",
      violationMessage: "The AC created condensation just when you needed clear vision most..."
    },
    {
      id: 106,
      title: "Wind Whispers",
      description: "Keep all windows closed during windstorms",
      difficulty: "easy",
      type: "weather",
      visible: false,
      trigger: "heavy_wind",
      violationMessage: "The wind carried something in that you shouldn't have let inside..."
    }
  ],

  passengers: [
    // Original passengers
    {
      id: 1,
      name: "Mrs. Chen",
      emoji: "👵",
      description: "Elderly woman, going to Riverside Cemetery",
      pickup: "Downtown Apartments",
      destination: "Riverside Cemetery",
      personalRule: "Hates bright lights - will ask you to dim dashboard",
      supernatural: "Ghost of former taxi passenger",
      fare: 15,
      rarity: "common",
      items: ["old locket", "withered flowers"],
      dialogue: ["It's so cold tonight, isn't it?", "I haven't been home in so long...", "Thank you for the ride, dear", "Why won't you look at me, dear?"],
      relationships: [],
      backstoryUnlocked: false,
      backstoryDetails: "Mrs. Chen was a regular taxi passenger for 40 years before her accident on this very route...",
      tells: [
        {
          type: 'verbal',
          intensity: 'moderate',
          description: "Asks why you won't make eye contact",
          triggerPhrase: "Why won't you look at me",
          reliability: 0.8
        },
        {
          type: 'behavioral',
          intensity: 'subtle',
          description: "Fidgets with old locket when ignored",
          animationCue: "fidget_locket",
          reliability: 0.6
        }
      ],
      guidelineExceptions: ["eye_contact_lonely"],
      deceptionLevel: 0.1,
      stressLevel: 0.7,
      trustRequired: 0.3
    },
    {
      id: 2,
      name: "Jake Morrison", 
      emoji: "👨‍💼",
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
      emoji: "👩‍🦰", 
      description: "Young woman with dirt under her fingernails",
      pickup: "Forest Road",
      destination: "Downtown Hotel",
      personalRule: "Gets nervous if you take highway - prefers back roads",
      supernatural: "Escaped from something in the woods",
      fare: 28,
      rarity: "common",
      items: ["muddy branch", "torn fabric", "cash with soil on it"],
      dialogue: ["I need to get back to civilization", "Stay away from the woods tonight", "They might still be following", "Don't take the highway, please - they use the main roads"],
      relationships: [8],
      backstoryUnlocked: false,
      backstoryDetails: "Sarah was part of a hiking group that went missing three years ago. She was the only one who 'returned'...",
      tells: [
        {
          type: 'verbal',
          intensity: 'obvious',
          description: "Warns against taking main roads",
          triggerPhrase: "Don't take",
          reliability: 0.9
        },
        {
          type: 'behavioral',
          intensity: 'moderate',
          description: "Shows visible panic when approaching highway entrances",
          animationCue: "panic_approach",
          reliability: 0.8
        }
      ],
      guidelineExceptions: ["gps_passenger_warning"],
      deceptionLevel: 0.2,
      stressLevel: 0.8,
      trustRequired: 0.4
    },
    {
      id: 4,
      name: "Dr. Hollow",
      emoji: "👨‍⚕️",
      description: "Doctor with old-fashioned medical bag",
      pickup: "Abandoned Hospital",
      destination: "Suburban House",
      personalRule: "Will offer medical advice - don't accept treatment",
      supernatural: "Former doctor who lost license for unethical experiments",
      fare: 35,
      rarity: "uncommon",
      items: ["antique syringe", "prescription pad", "surgical tools"],
      dialogue: ["House calls are so rare these days", "I can help with any pain you're feeling", "Medicine has come so far since my day", "Please, I need to stop - someone might need medical attention!"],
      relationships: [2, 9],
      backstoryUnlocked: false,
      backstoryDetails: "Dr. Hollow lost his license in 1987 for conducting unauthorized experiments on terminal patients...",
      tells: [
        {
          type: 'verbal',
          intensity: 'obvious',
          description: "Insists on stopping to help with medical emergencies",
          triggerPhrase: "need to stop",
          reliability: 0.8
        },
        {
          type: 'behavioral',
          intensity: 'moderate',
          description: "Constantly checking medical equipment in bag",
          animationCue: "check_medical_bag",
          reliability: 0.7
        }
      ],
      guidelineExceptions: ["stop_emergency_need"],
      deceptionLevel: 0.3,
      stressLevel: 0.5,
      trustRequired: 0.6
    },
    {
      id: 5,
      name: "The Collector",
      emoji: "🕴️",
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
      emoji: "👦",
      description: "Child in school uniform, shouldn't be out this late",
      pickup: "Elementary School",
      destination: "Suburban House",
      personalRule: "Don't ask about his parents - becomes very quiet",
      supernatural: "Lost child who doesn't realize he's been missing for decades",
      fare: 12,
      rarity: "common",
      items: ["torn homework", "old lunch box", "class photo"],
      dialogue: ["Is mommy waiting for me?", "I don't like the dark", "Teacher said I should go straight home", "Why won't anyone look at me? Am I being bad?"],
      relationships: [],
      backstoryUnlocked: false,
      backstoryDetails: "Tommy went missing from school in 1982. His backpack was found, but he never was...",
      tells: [
        {
          type: 'verbal',
          intensity: 'obvious',
          description: "Asks why no one will look at him",
          triggerPhrase: "Why won't anyone look at me",
          reliability: 0.9
        },
        {
          type: 'behavioral',
          intensity: 'moderate',
          description: "Voice trembles with increasing distress",
          audioCue: "child_distress",
          reliability: 0.7
        }
      ],
      guidelineExceptions: ["eye_contact_lonely"],
      deceptionLevel: 0.0,
      stressLevel: 0.6,
      trustRequired: 0.2
    },
    {
      id: 7,
      name: "Elena Vasquez",
      emoji: "💃",
      description: "Dancer in vintage dress, speaks with old accent",
      pickup: "Old Theater District",
      destination: "Downtown Hotel",
      personalRule: "Requests specific songs - humming along will break silence rule",
      supernatural: "1940s nightclub performer who died in a fire",
      fare: 30,
      rarity: "uncommon",
      items: ["vintage lipstick", "burned dance card", "pearl necklace"],
      dialogue: ["The music never stops playing in my head", "I had the most wonderful audition tonight", "Do you know any Glenn Miller?", "Please, I can't breathe - there's too much smoke in here!", "Could you open a window? The air is so thick..."],
      relationships: [12],
      backstoryUnlocked: false,
      backstoryDetails: "Elena was the star performer at the Moonlight Club before the fire of 1943 claimed 30 lives...",
      tells: [
        {
          type: 'verbal',
          intensity: 'obvious',
          description: "Complains about smoke and thick air",
          triggerPhrase: "can't breathe",
          reliability: 0.85
        },
        {
          type: 'behavioral',
          intensity: 'obvious',
          description: "Coughing and gasping, touching throat frequently",
          animationCue: "fire_victim_cough",
          audioCue: "distressed_breathing",
          reliability: 0.9
        },
        {
          type: 'behavioral',
          intensity: 'moderate',
          description: "Panics when looking at closed windows",
          animationCue: "claustrophobic_panic",
          reliability: 0.7
        }
      ],
      guidelineExceptions: ["windows_suffocation"],
      deceptionLevel: 0.0,
      stressLevel: 0.7,
      trustRequired: 0.3
    },
    {
      id: 8,
      name: "Marcus Thompson",
      emoji: "🏃‍♂️",
      description: "Jogger in athletic gear, constantly looking over shoulder",
      pickup: "Forest Road",
      destination: "Police Station",
      personalRule: "Keeps asking you to drive faster - accepting will violate route rules",
      supernatural: "Runner who encountered something supernatural in the woods",
      fare: 20,
      rarity: "common",
      items: ["torn running shoe", "strange claw marks on clothes", "broken GPS watch"],
      dialogue: ["Did you see that behind us?", "We need to go faster!", "I should have listened to the locals", "Talk to me, please - the silence is making me paranoid!", "We need to take a shortcut - they know the main roads!"],
      relationships: [3],
      backstoryUnlocked: false,
      backstoryDetails: "Marcus was training for a marathon when he took a wrong turn into the old growth forest...",
      tells: [
        {
          type: 'verbal',
          intensity: 'obvious',
          description: "Begs for conversation to calm paranoia",
          triggerPhrase: "Talk to me",
          reliability: 0.85
        },
        {
          type: 'behavioral',
          intensity: 'moderate',
          description: "Constantly looking over shoulder with terror",
          animationCue: "paranoid_looking",
          reliability: 0.8
        },
        {
          type: 'verbal',
          intensity: 'obvious',
          description: "Urgently requests shortcuts to avoid main roads",
          triggerPhrase: "take a shortcut",
          reliability: 0.9
        }
      ],
      guidelineExceptions: ["speak_nervous_passenger", "shortcut_time_critical"],
      deceptionLevel: 0.1,
      stressLevel: 0.9,
      trustRequired: 0.3
    },
    {
      id: 9,
      name: "Nurse Catherine",
      emoji: "👩‍⚕️",
      description: "Hospital nurse in stained scrubs, very tired",
      pickup: "General Hospital",
      destination: "Abandoned Hospital",
      personalRule: "Will offer to check your pulse - accepting triggers medical rule violation",
      supernatural: "Overworked nurse who made a fatal mistake",
      fare: 25,
      rarity: "common",
      items: ["medical clipboard", "broken stethoscope", "guilt-stained badge"],
      dialogue: ["Another long shift ending", "Some mistakes you can never take back", "The patients keep calling my name", "Please, just talk to me - I can't handle the silence right now", "I need to stop - I feel sick, really sick"],
      relationships: [4],
      backstoryUnlocked: false,
      backstoryDetails: "Catherine accidentally administered the wrong medication to a patient during a 36-hour shift...",
      tells: [
        {
          type: 'verbal',
          intensity: 'obvious',
          description: "Desperately asks for conversation to escape guilt",
          triggerPhrase: "just talk to me",
          reliability: 0.8
        },
        {
          type: 'behavioral',
          intensity: 'obvious',
          description: "Shows signs of severe nausea and distress",
          animationCue: "nausea_distress",
          reliability: 0.9
        },
        {
          type: 'behavioral',
          intensity: 'moderate',
          description: "Clutching medical clipboard with trembling hands",
          animationCue: "trembling_clipboard",
          reliability: 0.7
        }
      ],
      guidelineExceptions: ["speak_nervous_passenger", "stop_emergency_need"],
      deceptionLevel: 0.1,
      stressLevel: 0.8,
      trustRequired: 0.4
    },
    {
      id: 10,
      name: "Old Pete",
      emoji: "🎣",
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
      emoji: "🔮",
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
      emoji: "🎹",
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
      emoji: "👩‍🔬",
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
      emoji: "🕵️‍♂️",
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
      emoji: "🎩",
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
      emoji: "☠️",
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
      atmosphere: "Urban decay",
      riskLevel: 2
    },
    {
      name: "Riverside Cemetery", 
      description: "Ancient tombstones shrouded in fog",
      atmosphere: "Haunted",
      riskLevel: 4
    },
    {
      name: "Office District",
      description: "Glass towers with only a few lights on",
      atmosphere: "Corporate desolation",
      riskLevel: 1
    },
    {
      name: "Industrial Warehouse",
      description: "Loading docks and chain-link fences",
      atmosphere: "Abandoned industry",
      riskLevel: 3
    },
    {
      name: "Forest Road",
      description: "Tall trees block out the moonlight",
      atmosphere: "Wilderness danger",
      riskLevel: 5
    },
    {
      name: "Abandoned Hospital",
      description: "Broken windows and overgrown parking lot",
      atmosphere: "Medical horror",
      riskLevel: 5
    },
    {
      name: "Elementary School",
      description: "Empty playground with swings moving in windless air",
      atmosphere: "Childhood terror",
      riskLevel: 3
    },
    {
      name: "Suburban House",
      description: "Cookie-cutter homes with too-perfect lawns",
      atmosphere: "False normalcy",
      riskLevel: 2
    },
    {
      name: "Old Theater District",
      description: "Faded marquees and darkened stage doors",
      atmosphere: "Forgotten glamour",
      riskLevel: 3
    },
    {
      name: "Downtown Hotel",
      description: "Art deco lobby with no guests at the desk",
      atmosphere: "Transient luxury",
      riskLevel: 2
    },
    {
      name: "Police Station",
      description: "Harsh fluorescent lights and barred windows",
      atmosphere: "Institutional authority",
      riskLevel: 1
    },
    {
      name: "General Hospital",
      description: "Sterile corridors echoing with distant footsteps",
      atmosphere: "Clinical dread",
      riskLevel: 2
    },
    {
      name: "Harbor District",
      description: "Fog-shrouded docks with creaking piers",
      atmosphere: "Maritime mystery",
      riskLevel: 4
    },
    {
      name: "Psychic Shop",
      description: "Neon palm reader sign buzzing in the window",
      atmosphere: "Occult commerce",
      riskLevel: 3
    },
    {
      name: "Music Hall",
      description: "Grand concert hall with dust motes dancing in spotlight",
      atmosphere: "Haunted artistry",
      riskLevel: 3
    },
    {
      name: "Old Cathedral",
      description: "Gothic spires piercing the night sky",
      atmosphere: "Sacred sanctuary",
      riskLevel: 2
    },
    {
      name: "Seminary",
      description: "Ivy-covered religious institution with glowing windows",
      atmosphere: "Theological study",
      riskLevel: 1
    },
    {
      name: "Crime Scene",
      description: "Yellow tape fluttering around chalk outlines",
      atmosphere: "Recent violence",
      riskLevel: 4
    },
    {
      name: "City Hall",
      description: "Imposing government building with marble columns",
      atmosphere: "Municipal power",
      riskLevel: 2
    },
    {
      name: "Private Estate",
      description: "Gated mansion hidden behind ancient oak trees",
      atmosphere: "Exclusive mystery",
      riskLevel: 4
    },
    {
      name: "Private Residence",
      description: "Unremarkable house with secrets behind curtained windows",
      atmosphere: "Hidden darkness",
      riskLevel: 3
    },
    {
      name: "Antique Shop",
      description: "Cluttered storefront filled with objects from forgotten times",
      atmosphere: "Temporal commerce",
      riskLevel: 3
    },
    {
      name: "Crossroads",
      description: "Four paths meeting where streetlights fail to reach",
      atmosphere: "Decision point",
      riskLevel: 5
    },
    {
      name: "End of the Line",
      description: "The place where all journeys ultimately lead",
      atmosphere: "Final destination",
      riskLevel: 5
    }
  ]
};