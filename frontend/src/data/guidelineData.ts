import type { Guideline } from "../types/game";

// Sample guideline data based on design notes - transforms rigid rules into flexible guidelines with exceptions
export const guidelineData: Guideline[] = [
  {
    id: 1001,
    title: "Never Make Eye Contact",
    description:
      "Avoid looking directly at passengers to prevent supernatural consequences",
    difficulty: "medium",
    type: "basic",
    visible: true,
    isGuideline: true,
    defaultSafety: "safe",
    exceptions: [
      {
        id: "eye_contact_lonely",
        passengerTypes: [
          "Ghost of former taxi passenger",
          "Lost child who doesn't realize he's been missing",
        ],
        conditions: [
          {
            type: "passenger_dialogue",
            value: "Why won't you look at me",
            operator: "contains",
            description: "Passenger asks for acknowledgment",
          },
          {
            type: "passenger_behavior",
            value: 0.6,
            operator: "greater_than",
            description: "High stress level indicating need for comfort",
          },
        ],
        tells: [
          {
            type: "verbal",
            intensity: "obvious",
            description: "Passenger asks 'Why won't you look at me?'",
            triggerPhrase: "Why won't you look at me",
            reliability: 0.9,
          },
          {
            type: "behavioral",
            intensity: "moderate",
            description:
              "Passenger fidgets nervously and glances at mirror repeatedly",
            animationCue: "fidget_glance",
            reliability: 0.7,
          },
          {
            type: "verbal",
            intensity: "subtle",
            description: "Voice gets louder and more agitated over time",
            audioCue: "voice_escalation",
            reliability: 0.6,
          },
        ],
        breakingSafer: true,
        description:
          "Lonely passengers need acknowledgment or they become hostile",
        probability: 0.3,
        requiredStage: "warning",
      },
    ],
    followConsequences: [
      {
        type: "survival",
        value: 1,
        description: "Avoided supernatural gaze encounter",
        probability: 0.8,
      },
    ],
    breakConsequences: [
      {
        type: "death",
        value: 1,
        description: "Made eye contact - face twisted into void",
        probability: 0.7,
      },
    ],
    exceptionRewards: [
      {
        type: "reputation",
        value: 8,
        description: "Acknowledged a lonely spirit with compassion.",
        probability: 0.75,
      },
      {
        type: "story_unlock",
        value: 1,
        description: "Unlocked a new memory from the restless passenger.",
        probability: 0.5,
      },
    ],
  },

  {
    id: 1002,
    title: "Always Follow GPS",
    description:
      "Stick to the designated route to avoid getting lost or encountering danger",
    difficulty: "hard",
    type: "basic",
    visible: true,
    isGuideline: true,
    defaultSafety: "safe",
    exceptions: [
      {
        id: "gps_passenger_warning",
        passengerTypes: [
          "Escaped from something in the woods",
          "Runner who encountered supernatural",
        ],
        conditions: [
          {
            type: "passenger_dialogue",
            value: "Don't take",
            operator: "contains",
            description: "Passenger warns against specific route",
          },
        ],
        tells: [
          {
            type: "verbal",
            intensity: "obvious",
            description: "Don't take the tunnel, please, the voices live there",
            triggerPhrase: "Don't take",
            reliability: 0.8,
          },
          {
            type: "behavioral",
            intensity: "moderate",
            description: "Shows visible panic when approaching landmark",
            animationCue: "panic_approach",
            reliability: 0.7,
          },
          {
            type: "verbal",
            intensity: "subtle",
            description: "Mutters about danger or voices ahead",
            audioCue: "worried_mutter",
            reliability: 0.6,
          },
        ],
        breakingSafer: true,
        description: "Passenger knows of supernatural danger on the GPS route",
        probability: 0.4,
        requiredStage: "warning",
      },
    ],
    followConsequences: [
      {
        type: "survival",
        value: 1,
        description: "Stayed on safe, known route",
        probability: 0.85,
      },
    ],
    breakConsequences: [
      {
        type: "fuel",
        value: -10,
        description: "Got lost taking shortcuts",
        probability: 0.6,
      },
      {
        type: "death",
        value: 1,
        description: "Supernatural ambush on unknown route",
        probability: 0.3,
      },
    ],
    exceptionRewards: [
      {
        type: "reputation",
        value: 10,
        description:
          "Proved you can read the signs and save passengers in danger.",
        probability: 0.7,
      },
      {
        type: "money",
        value: 20,
        description: "Passenger doubled the fare in gratitude for the detour.",
        probability: 0.6,
      },
    ],
  },

  {
    id: 1003,
    title: "Cash Only Payment",
    description:
      "Only accept cash to avoid cursed coins or spectral payment methods",
    difficulty: "hard",
    type: "basic",
    visible: true,
    isGuideline: true,
    defaultSafety: "safe",
    exceptions: [
      {
        id: "cash_intangible_beings",
        passengerTypes: [
          "Ghost of former taxi passenger",
          "1940s nightclub performer who died in a fire",
        ],
        conditions: [
          {
            type: "passenger_dialogue",
            value: "earthly money",
            operator: "contains",
            description: "Passenger mentions not having physical currency",
          },
        ],
        tells: [
          {
            type: "visual",
            intensity: "obvious",
            description: "Hand passes through wallet or cash",
            animationCue: "hand_through_wallet",
            reliability: 0.9,
          },
          {
            type: "verbal",
            intensity: "moderate",
            description: "I don't have any earthly money on me",
            triggerPhrase: "earthly money",
            reliability: 0.8,
          },
          {
            type: "behavioral",
            intensity: "subtle",
            description: "Fumbles with transparent or ethereal payment",
            animationCue: "ethereal_payment",
            reliability: 0.6,
          },
        ],
        breakingSafer: true,
        description:
          "Ghosts can't handle physical currency - refusing their payment angers them",
        probability: 0.25,
        requiredStage: "warning",
      },
    ],
    followConsequences: [
      {
        type: "money",
        value: 20,
        description: "Received legitimate cash payment",
        probability: 0.9,
      },
    ],
    breakConsequences: [
      {
        type: "death",
        value: 1,
        description: "Cursed payment drained your life force",
        probability: 0.5,
      },
    ],
    exceptionRewards: [
      {
        type: "reputation",
        value: 7,
        description: "Offered grace to a spirit who could not pay.",
        probability: 0.65,
      },
      {
        type: "story_unlock",
        value: 1,
        description: "Gained a favor redeemable with the spectral community.",
        probability: 0.45,
      },
    ],
  },

  {
    id: 1011,
    title: "Maintain Broadcast Silence",
    description:
      "Keep the cab silent to avoid tuning into supernatural frequencies",
    difficulty: "easy",
    type: "basic",
    visible: true,
    isGuideline: true,
    defaultSafety: "safe",
    actionKey: "play_music",
    actionType: "forbidden",
    exceptions: [
      {
        id: "silent_soothing_song",
        passengerTypes: [
          "Insomniac medium with restless spirits",
          "Teenage banshee with stage fright",
        ],
        conditions: [
          {
            type: "passenger_dialogue",
            value: "music",
            operator: "contains",
            description: "Passenger pleads for calming music",
          },
          {
            type: "passenger_behavior",
            value: 0.65,
            operator: "greater_than",
            description: "Stress level high enough to risk an outburst",
          },
        ],
        tells: [
          {
            type: "verbal",
            intensity: "obvious",
            description: "Please—just a soft song before I scream",
            triggerPhrase: "soft song",
            reliability: 0.85,
          },
          {
            type: "behavioral",
            intensity: "moderate",
            description: "Passenger rocks back and forth gripping the seat",
            animationCue: "rocking_panic",
            reliability: 0.7,
          },
          {
            type: "verbal",
            intensity: "subtle",
            description:
              "Hums the first few notes of a lullaby under their breath",
            audioCue: "hummed_lullaby",
            reliability: 0.6,
          },
        ],
        breakingSafer: true,
        description:
          "Certain passengers need a calming melody to keep their powers in check",
        probability: 0.3,
        requiredStage: "warning",
      },
    ],
    followConsequences: [
      {
        type: "survival",
        value: 1,
        description: "Silence kept the radio ghouls asleep",
        probability: 0.8,
      },
    ],
    breakConsequences: [
      {
        type: "death",
        value: 1,
        description: "Amplified whispers lured something terrible into the cab",
        probability: 0.4,
      },
      {
        type: "fuel",
        value: -5,
        description: "Interference with onboard systems drained power",
        probability: 0.5,
      },
    ],
    exceptionRewards: [
      {
        type: "reputation",
        value: 6,
        description: "Known as the driver who keeps nervous passengers steady",
        probability: 0.7,
      },
      {
        type: "item",
        value: 1,
        description:
          "Passenger gifts you a charm that tunes out hostile frequencies",
        probability: 0.35,
      },
    ],
  },

  {
    id: 1004,
    title: "Never Speak First",
    description:
      "Let passengers initiate conversation to avoid drawing supernatural attention",
    difficulty: "medium",
    type: "basic",
    visible: true,
    isGuideline: true,
    defaultSafety: "safe",
    exceptions: [
      {
        id: "speak_nervous_passenger",
        conditions: [
          {
            type: "passenger_dialogue",
            value: "Talk to me",
            operator: "contains",
            description: "Passenger explicitly asks for conversation",
          },
          {
            type: "passenger_behavior",
            value: 0.7,
            operator: "greater_than",
            description: "Very high stress level",
          },
        ],
        tells: [
          {
            type: "verbal",
            intensity: "obvious",
            description: "Talk to me, please, or I'll lose control",
            triggerPhrase: "Talk to me",
            reliability: 0.85,
          },
          {
            type: "behavioral",
            intensity: "moderate",
            description: "Whispers to themselves and glances nervously",
            animationCue: "self_whisper_glance",
            reliability: 0.7,
          },
          {
            type: "verbal",
            intensity: "subtle",
            description: "Breathing becomes rapid and panicked",
            audioCue: "panicked_breathing",
            reliability: 0.6,
          },
        ],
        breakingSafer: true,
        description:
          "Nervous passengers need conversation to prevent violent breakdown",
        probability: 0.35,
        requiredStage: "warning",
      },
    ],
    followConsequences: [
      {
        type: "survival",
        value: 1,
        description: "Avoided drawing unwanted attention",
        probability: 0.8,
      },
    ],
    breakConsequences: [
      {
        type: "death",
        value: 1,
        description: "Breaking silence attracted something hostile",
        probability: 0.4,
      },
    ],
    exceptionRewards: [
      {
        type: "reputation",
        value: 6,
        description: "Talked a passenger down from the brink.",
        probability: 0.65,
      },
    ],
  },

  {
    id: 1005,
    title: "Never Stop Until Drop-Off",
    description:
      "Keep the car moving to avoid creatures catching up or passengers turning violent",
    difficulty: "medium",
    type: "basic",
    visible: true,
    isGuideline: true,
    defaultSafety: "safe",
    exceptions: [
      {
        id: "stop_emergency_need",
        conditions: [
          {
            type: "passenger_dialogue",
            value: "stop",
            operator: "contains",
            description: "Passenger requests emergency stop",
          },
        ],
        tells: [
          {
            type: "verbal",
            intensity: "obvious",
            description:
              "I'll starve if we don't stop / I'm sick, I'll contaminate you",
            triggerPhrase: "stop",
            reliability: 0.8,
          },
          {
            type: "behavioral",
            intensity: "obvious",
            description: "Clutching stomach, sweating profusely",
            animationCue: "clutch_stomach_sweat",
            reliability: 0.9,
          },
          {
            type: "behavioral",
            intensity: "moderate",
            description: "Begging repeatedly with desperate gestures",
            animationCue: "desperate_begging",
            reliability: 0.7,
          },
        ],
        breakingSafer: true,
        description: "Some passengers have legitimate emergency needs",
        probability: 0.2,
        requiredStage: "critical",
      },
    ],
    followConsequences: [
      {
        type: "survival",
        value: 1,
        description: "Avoided creatures and kept passenger stable",
        probability: 0.75,
      },
    ],
    breakConsequences: [
      {
        type: "death",
        value: 1,
        description: "Something caught up while stopped",
        probability: 0.6,
      },
    ],
    exceptionRewards: [
      {
        type: "reputation",
        value: 9,
        description: "Trusted the emergency and saved your passenger.",
        probability: 0.6,
      },
    ],
  },

  {
    id: 1006,
    title: "Keep Windows Sealed",
    description:
      "Maintain closed windows to prevent spirits, smoke, or whispers from entering",
    difficulty: "medium",
    type: "basic",
    visible: true,
    isGuideline: true,
    defaultSafety: "safe",
    exceptions: [
      {
        id: "windows_suffocation",
        conditions: [
          {
            type: "passenger_dialogue",
            value: "air",
            operator: "contains",
            description: "Passenger mentions breathing problems",
          },
        ],
        tells: [
          {
            type: "behavioral",
            intensity: "obvious",
            description: "Coughing, gasping for air",
            animationCue: "cough_gasp",
            audioCue: "labored_breathing",
            reliability: 0.9,
          },
          {
            type: "behavioral",
            intensity: "moderate",
            description: "Panics at their reflection in the glass",
            animationCue: "reflection_panic",
            reliability: 0.7,
          },
          {
            type: "verbal",
            intensity: "subtle",
            description: "Mentions needing fresh air or suffocating",
            triggerPhrase: "air",
            reliability: 0.6,
          },
        ],
        breakingSafer: true,
        description:
          "Some passengers genuinely need air or sunlight protection",
        probability: 0.15,
        requiredStage: "critical",
      },
    ],
    followConsequences: [
      {
        type: "survival",
        value: 1,
        description: "Blocked out harmful supernatural influences",
        probability: 0.8,
      },
    ],
    breakConsequences: [
      {
        type: "death",
        value: 1,
        description: "Spirits entered through open window",
        probability: 0.5,
      },
    ],
    exceptionRewards: [
      {
        type: "reputation",
        value: 9,
        description: "Spared a passenger from suffocating in the sealed cab.",
        probability: 0.7,
      },
      {
        type: "item",
        value: 1,
        description: "Received a sunlight talisman for your empathy.",
        probability: 0.4,
      },
    ],
  },

  {
    id: 1007,
    title: "Never Speak First",
    description:
      "Let passengers initiate conversation to avoid drawing supernatural attention",
    difficulty: "medium",
    type: "basic",
    visible: true,
    isGuideline: true,
    defaultSafety: "safe",
    exceptions: [
      {
        id: "speak_nervous_passenger",
        passengerTypes: [
          "Overworked nurse who made a fatal mistake",
          "Runner who encountered supernatural",
        ],
        conditions: [
          {
            type: "passenger_dialogue",
            value: "Talk to me",
            operator: "contains",
            description: "Passenger explicitly asks for conversation",
          },
          {
            type: "passenger_behavior",
            value: 0.7,
            operator: "greater_than",
            description: "Very high stress level indicating breakdown risk",
          },
        ],
        tells: [
          {
            type: "verbal",
            intensity: "obvious",
            description: "Talk to me, please, or I'll lose control",
            triggerPhrase: "Talk to me",
            reliability: 0.85,
          },
          {
            type: "behavioral",
            intensity: "moderate",
            description:
              "Whispers to themselves and glances nervously at driver",
            animationCue: "self_whisper_glance",
            reliability: 0.7,
          },
          {
            type: "behavioral",
            intensity: "obvious",
            description: "Breathing becomes rapid and panicked",
            audioCue: "panicked_breathing",
            reliability: 0.8,
          },
          {
            type: "verbal",
            intensity: "subtle",
            description: "Voice trembles with increasing desperation",
            audioCue: "voice_trembling",
            reliability: 0.6,
          },
        ],
        breakingSafer: true,
        description:
          "Nervous passengers need conversation to prevent violent psychological breakdown",
        probability: 0.35,
      },
    ],
    followConsequences: [
      {
        type: "survival",
        value: 1,
        description: "Avoided drawing unwanted supernatural attention",
        probability: 0.8,
      },
      {
        type: "reputation",
        value: 5,
        description: "Maintained professional distance",
        probability: 0.6,
      },
    ],
    breakConsequences: [
      {
        type: "death",
        value: 1,
        description:
          "Breaking silence attracted something hostile from the shadows",
        probability: 0.4,
      },
      {
        type: "reputation",
        value: -5,
        description: "Unprofessional behavior noted",
        probability: 0.3,
      },
    ],
  },

  {
    id: 1008,
    title: "Never Stop Until Drop-Off",
    description:
      "Keep the car moving to avoid creatures catching up or passengers turning violent",
    difficulty: "medium",
    type: "basic",
    visible: true,
    isGuideline: true,
    defaultSafety: "safe",
    exceptions: [
      {
        id: "stop_emergency_need",
        passengerTypes: [
          "Overworked nurse who made a fatal mistake",
          "Former doctor who lost license",
        ],
        conditions: [
          {
            type: "passenger_dialogue",
            value: "stop",
            operator: "contains",
            description: "Passenger requests emergency stop",
          },
          {
            type: "passenger_behavior",
            value: 0.8,
            operator: "greater_than",
            description: "Critical stress level indicating medical emergency",
          },
        ],
        tells: [
          {
            type: "verbal",
            intensity: "obvious",
            description:
              "I need to stop - I'm going to be sick, I'll contaminate everything!",
            triggerPhrase: "need to stop",
            reliability: 0.8,
          },
          {
            type: "behavioral",
            intensity: "obvious",
            description: "Clutching stomach and sweating profusely",
            animationCue: "clutch_stomach_sweat",
            reliability: 0.9,
          },
          {
            type: "behavioral",
            intensity: "moderate",
            description:
              "Begging repeatedly with increasingly desperate gestures",
            animationCue: "desperate_begging",
            reliability: 0.7,
          },
          {
            type: "behavioral",
            intensity: "obvious",
            description: "Pale complexion and visible trembling",
            animationCue: "pale_trembling",
            reliability: 0.85,
          },
        ],
        breakingSafer: true,
        description:
          "Some passengers have legitimate medical emergencies that require immediate stops",
        probability: 0.2,
      },
    ],
    followConsequences: [
      {
        type: "survival",
        value: 1,
        description:
          "Avoided creatures and kept passenger stable during transport",
        probability: 0.75,
      },
      {
        type: "fuel",
        value: 2,
        description: "Efficient continuous driving saved fuel",
        probability: 0.4,
      },
    ],
    breakConsequences: [
      {
        type: "death",
        value: 1,
        description:
          "Something in the shadows caught up while the car was stopped",
        probability: 0.6,
      },
      {
        type: "time",
        value: -5,
        description: "Lost valuable time during emergency stop",
        probability: 0.8,
      },
    ],
  },

  {
    id: 1009,
    title: "Keep Windows Sealed",
    description:
      "Maintain closed windows to prevent spirits, smoke, or whispers from entering",
    difficulty: "medium",
    type: "basic",
    visible: true,
    isGuideline: true,
    defaultSafety: "safe",
    exceptions: [
      {
        id: "windows_suffocation",
        passengerTypes: [
          "1940s nightclub performer who died in a fire",
          "Drowned fisherman who refuses to accept his fate",
        ],
        conditions: [
          {
            type: "passenger_dialogue",
            value: "air",
            operator: "contains",
            description:
              "Passenger mentions breathing problems or need for air",
          },
          {
            type: "passenger_behavior",
            value: 0.6,
            operator: "greater_than",
            description: "High stress level indicating respiratory distress",
          },
        ],
        tells: [
          {
            type: "behavioral",
            intensity: "obvious",
            description: "Coughing violently and gasping for air",
            animationCue: "cough_gasp",
            audioCue: "labored_breathing",
            reliability: 0.9,
          },
          {
            type: "behavioral",
            intensity: "moderate",
            description:
              "Panics when seeing their reflection in the closed glass",
            animationCue: "reflection_panic",
            reliability: 0.7,
          },
          {
            type: "verbal",
            intensity: "obvious",
            description: "Please, I can't breathe - I need fresh air!",
            triggerPhrase: "can't breathe",
            reliability: 0.85,
          },
          {
            type: "behavioral",
            intensity: "subtle",
            description: "Keeps touching throat and wiping sweat from forehead",
            animationCue: "throat_touch_sweat",
            reliability: 0.6,
          },
        ],
        breakingSafer: true,
        description:
          "Some passengers genuinely need air circulation or suffer from claustrophobia",
        probability: 0.15,
      },
    ],
    followConsequences: [
      {
        type: "survival",
        value: 1,
        description: "Blocked out harmful supernatural influences and whispers",
        probability: 0.8,
      },
      {
        type: "reputation",
        value: 3,
        description: "Maintained safe driving protocols",
        probability: 0.5,
      },
    ],
    breakConsequences: [
      {
        type: "death",
        value: 1,
        description: "Malevolent spirits entered through the open window",
        probability: 0.5,
      },
      {
        type: "fuel",
        value: -3,
        description:
          "Air resistance from open windows increased fuel consumption",
        probability: 0.7,
      },
    ],
  },

  {
    id: 1010,
    title: "No Shortcuts or Detours",
    description:
      "Stick to main roads to avoid cursed zones and supernatural ambushes",
    difficulty: "hard",
    type: "basic",
    visible: true,
    isGuideline: true,
    defaultSafety: "safe",
    exceptions: [
      {
        id: "shortcut_time_critical",
        passengerTypes: [
          "Jazz musician who made a deal for talent",
          "The reaper who collects souls",
        ],
        conditions: [
          {
            type: "passenger_dialogue",
            value: "late",
            operator: "contains",
            description: "Passenger expresses urgency about timing",
          },
          {
            type: "time_based",
            value: 30,
            operator: "less_than",
            description: "Less than 30 minutes remaining in shift",
          },
        ],
        tells: [
          {
            type: "behavioral",
            intensity: "obvious",
            description: "Frantically checking watch every few seconds",
            animationCue: "frantic_watch_check",
            reliability: 0.8,
          },
          {
            type: "behavioral",
            intensity: "moderate",
            description: "Rapid, shallow breathing showing extreme anxiety",
            audioCue: "rapid_breathing",
            reliability: 0.7,
          },
          {
            type: "verbal",
            intensity: "obvious",
            description:
              "If I'm late, something terrible will happen - they'll come for me!",
            triggerPhrase: "something terrible will happen",
            reliability: 0.9,
          },
          {
            type: "behavioral",
            intensity: "moderate",
            description: "Muttering about consequences of being late",
            audioCue: "worried_muttering",
            reliability: 0.6,
          },
        ],
        breakingSafer: true,
        description:
          "Some passengers face dire supernatural consequences if they arrive late",
        probability: 0.25,
      },
    ],
    followConsequences: [
      {
        type: "survival",
        value: 1,
        description: "Avoided cursed zones and supernatural ambush points",
        probability: 0.85,
      },
      {
        type: "time",
        value: -3,
        description: "Longer route took additional time",
        probability: 0.9,
      },
    ],
    breakConsequences: [
      {
        type: "death",
        value: 1,
        description:
          "Shortcut led through a cursed zone - something was waiting",
        probability: 0.3,
      },
      {
        type: "time",
        value: 5,
        description: "Shortcut saved valuable time",
        probability: 0.8,
      },
      {
        type: "fuel",
        value: -2,
        description: "Got lost on unfamiliar shortcut roads",
        probability: 0.4,
      },
    ],
  },
];
