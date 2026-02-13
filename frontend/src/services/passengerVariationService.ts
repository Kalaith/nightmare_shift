import type { Passenger, PassengerTell } from "../types/game";

interface PassengerVariation {
  tells: PassengerTell[];
  dialogue: string[];
  stressLevel: number;
  deceptionLevel: number;
  behaviorPattern: "nervous" | "deceptive" | "desperate" | "calm" | "hostile";
}

interface TellVariation {
  baseType: PassengerTell["type"];
  intensity: PassengerTell["intensity"];
  descriptions: string[];
  triggerPhrases: string[];
  reliabilityRange: [number, number];
}

export class PassengerVariationService {
  private static tellVariations: Record<string, TellVariation[]> = {
    eye_contact_lonely: [
      {
        baseType: "verbal",
        intensity: "obvious",
        descriptions: [
          "Why won't you look at me, dear?",
          "Please, just acknowledge I'm here",
          "Am I invisible to you too?",
          "Everyone always looks away from me",
        ],
        triggerPhrases: [
          "Why won't you look",
          "acknowledge I'm here",
          "invisible",
          "looks away",
        ],
        reliabilityRange: [0.8, 0.95],
      },
      {
        baseType: "behavioral",
        intensity: "moderate",
        descriptions: [
          "Fidgets with old belongings nervously",
          "Taps fingers anxiously on seat",
          "Shifts position repeatedly seeking attention",
          "Makes small noises to get noticed",
        ],
        triggerPhrases: [],
        reliabilityRange: [0.6, 0.8],
      },
    ],

    speak_nervous_passenger: [
      {
        baseType: "verbal",
        intensity: "obvious",
        descriptions: [
          "Talk to me, please, or I'll lose control",
          "The silence is driving me crazy",
          "I can't handle being alone with my thoughts",
          "Please say something, anything!",
        ],
        triggerPhrases: [
          "Talk to me",
          "silence is driving",
          "alone with my thoughts",
          "say something",
        ],
        reliabilityRange: [0.85, 0.95],
      },
      {
        baseType: "behavioral",
        intensity: "moderate",
        descriptions: [
          "Muttering anxiously under breath",
          "Wringing hands with increasing desperation",
          "Breathing becomes shallow and rapid",
          "Glances frantically between driver and windows",
        ],
        triggerPhrases: [],
        reliabilityRange: [0.65, 0.85],
      },
    ],

    stop_emergency_need: [
      {
        baseType: "verbal",
        intensity: "obvious",
        descriptions: [
          "I need to stop - I'm going to be sick!",
          "Please pull over, it's an emergency",
          "I can't make it to the destination like this",
          "Stop the car now or I'll contaminate everything!",
        ],
        triggerPhrases: [
          "need to stop",
          "pull over",
          "emergency",
          "contaminate",
        ],
        reliabilityRange: [0.8, 0.9],
      },
      {
        baseType: "behavioral",
        intensity: "obvious",
        descriptions: [
          "Clutching stomach and doubled over",
          "Sweating profusely with pale complexion",
          "Trembling uncontrollably",
          "Making gagging sounds",
        ],
        triggerPhrases: [],
        reliabilityRange: [0.9, 0.95],
      },
    ],
  };

  private static dialogueVariations: Record<string, string[][]> = {
    nervous: [
      [
        "Please don't leave me alone",
        "I keep hearing things",
        "Something's following me",
      ],
      [
        "The shadows look wrong tonight",
        "Do you feel that too?",
        "We're not alone, are we?",
      ],
      [
        "I shouldn't have come out tonight",
        "They warned me about this",
        "It's too quiet",
      ],
    ],

    deceptive: [
      [
        "Everything's fine, just drive",
        "Nothing to worry about",
        "I'm perfectly normal",
      ],
      [
        "Trust me, I know what I'm doing",
        "The others were wrong about me",
        "You seem very... perceptive",
      ],
      [
        "What a lovely night for a drive",
        "I do this route often",
        "Such interesting conversations we could have",
      ],
    ],

    desperate: [
      ["You have to help me", "They'll find me soon", "Time is running out"],
      ["Please believe me", "I'm not crazy, I swear", "You're my only hope"],
      [
        "Don't let them take me back",
        "I can't go through that again",
        "Please, I'm begging you",
      ],
    ],
  };

  /**
   * Generates a randomized variation of a passenger for replay value
   */
  static generatePassengerVariation(
    basePassenger: Passenger,
    playerExperience: number = 0,
  ): Passenger {
    const variation = this.selectBehaviorPattern(
      basePassenger,
      playerExperience,
    );
    const variationId = Math.random().toString(36).substr(2, 9);

    return {
      ...basePassenger,
      id: basePassenger.id + Math.random() * 1000, // Unique instance ID
      tells: this.generateVariationTells(
        basePassenger,
        variation,
        playerExperience,
      ),
      dialogue: this.generateVariationDialogue(basePassenger, variation),
      stressLevel: this.adjustStressLevel(
        basePassenger.stressLevel || 0.5,
        variation,
        playerExperience,
      ),
      deceptionLevel: this.adjustDeceptionLevel(
        basePassenger.deceptionLevel || 0,
        variation,
        playerExperience,
      ),
      trustRequired: this.adjustTrustRequired(
        basePassenger.trustRequired || 0.5,
        variation,
        playerExperience,
      ),
      // Add variation metadata for tracking
      variationId,
      basePassengerId: basePassenger.id,
    } as Passenger & { variationId: string; basePassengerId: number };
  }

  /**
   * Selects behavior pattern based on passenger type and player experience
   */
  private static selectBehaviorPattern(
    passenger: Passenger,
    playerExperience: number,
  ): PassengerVariation["behaviorPattern"] {
    const baseStress = passenger.stressLevel || 0.5;
    const baseDeception = passenger.deceptionLevel || 0;

    // Higher experience = more deceptive passengers
    const deceptionBonus = Math.min(0.3, playerExperience * 0.01);
    const patterns: PassengerVariation["behaviorPattern"][] = [
      "nervous",
      "desperate",
      "calm",
    ];

    if (baseDeception + deceptionBonus > 0.5) {
      patterns.push("deceptive", "hostile");
    }

    if (baseStress > 0.7) {
      patterns.push("desperate", "nervous");
    }

    return patterns[Math.floor(Math.random() * patterns.length)];
  }

  /**
   * Generates varied tells based on the passenger's base exceptions and behavior pattern
   */
  private static generateVariationTells(
    passenger: Passenger,
    behaviorPattern: PassengerVariation["behaviorPattern"],
    playerExperience: number,
  ): PassengerTell[] {
    if (!passenger.guidelineExceptions || !passenger.tells) {
      return passenger.tells || [];
    }

    const variationTells: PassengerTell[] = [];

    for (const exceptionId of passenger.guidelineExceptions) {
      const variations = this.tellVariations[exceptionId];
      if (!variations) continue;

      // Select 1-3 tells per exception based on behavior pattern
      const numTells =
        behaviorPattern === "deceptive" ? 1 : Math.floor(Math.random() * 2) + 1;
      const selectedVariations = this.shuffleArray([...variations]).slice(
        0,
        numTells,
      );

      for (const variation of selectedVariations) {
        const description =
          variation.descriptions[
            Math.floor(Math.random() * variation.descriptions.length)
          ];
        const triggerPhrase =
          variation.triggerPhrases.length > 0
            ? variation.triggerPhrases[
                Math.floor(Math.random() * variation.triggerPhrases.length)
              ]
            : undefined;

        // Adjust reliability based on experience and behavior
        const baseReliability =
          variation.reliabilityRange[0] +
          Math.random() *
            (variation.reliabilityRange[1] - variation.reliabilityRange[0]);

        let adjustedReliability = baseReliability;
        if (behaviorPattern === "deceptive") adjustedReliability *= 0.7; // Deceptive passengers have less reliable tells
        if (playerExperience > 50) adjustedReliability *= 0.8; // Experienced players face harder reads

        variationTells.push({
          type: variation.baseType,
          intensity: variation.intensity,
          description,
          triggerPhrase,
          reliability: Math.max(0.1, Math.min(0.95, adjustedReliability)),
          animationCue: `${behaviorPattern}_${variation.baseType}_${Math.floor(Math.random() * 3)}`,
          audioCue:
            variation.baseType === "verbal"
              ? `${behaviorPattern}_speech`
              : undefined,
        });
      }
    }

    return variationTells;
  }

  /**
   * Generates varied dialogue based on behavior pattern
   */
  private static generateVariationDialogue(
    passenger: Passenger,
    behaviorPattern: PassengerVariation["behaviorPattern"],
  ): string[] {
    const baseDialogue = passenger.dialogue || [];
    const patternDialogue = this.dialogueVariations[behaviorPattern] || [[]];

    // Mix base dialogue with pattern-specific dialogue
    const selectedPatternSet =
      patternDialogue[Math.floor(Math.random() * patternDialogue.length)];
    const mixedDialogue = [...baseDialogue];

    // Replace 1-2 base dialogue lines with pattern-specific ones
    const numReplacements = Math.min(
      selectedPatternSet.length,
      Math.floor(Math.random() * 2) + 1,
    );
    for (let i = 0; i < numReplacements; i++) {
      const replaceIndex = Math.floor(Math.random() * mixedDialogue.length);
      mixedDialogue[replaceIndex] = selectedPatternSet[i];
    }

    return mixedDialogue;
  }

  /**
   * Adjusts stress level based on behavior pattern and player experience
   */
  private static adjustStressLevel(
    baseStress: number,
    behaviorPattern: PassengerVariation["behaviorPattern"],
    playerExperience: number,
  ): number {
    let adjusted = baseStress;

    switch (behaviorPattern) {
      case "nervous":
        adjusted += 0.2;
        break;
      case "desperate":
        adjusted += 0.3;
        break;
      case "deceptive":
        adjusted -= 0.1; // Deceptive passengers appear calmer
        break;
      case "calm":
        adjusted -= 0.2;
        break;
      case "hostile":
        adjusted += 0.1;
        break;
    }

    // Higher experience = more extreme stress levels for challenge
    if (playerExperience > 30) {
      adjusted += (Math.random() - 0.5) * 0.3;
    }

    return Math.max(0, Math.min(1, adjusted));
  }

  /**
   * Adjusts deception level based on behavior pattern and player experience
   */
  private static adjustDeceptionLevel(
    baseDeception: number,
    behaviorPattern: PassengerVariation["behaviorPattern"],
    playerExperience: number,
  ): number {
    let adjusted = baseDeception;

    switch (behaviorPattern) {
      case "deceptive":
        adjusted += 0.4;
        break;
      case "hostile":
        adjusted += 0.2;
        break;
      case "calm":
        adjusted += 0.1; // Sometimes calm is suspicious
        break;
    }

    // Scale deception with player experience
    adjusted += Math.min(0.3, playerExperience * 0.005);

    return Math.max(0, Math.min(0.9, adjusted));
  }

  /**
   * Adjusts trust required based on behavior pattern
   */
  private static adjustTrustRequired(
    baseTrust: number,
    behaviorPattern: PassengerVariation["behaviorPattern"],
    _playerExperience: number,
  ): number {
    let adjusted = baseTrust;

    switch (behaviorPattern) {
      case "deceptive":
        adjusted += 0.3;
        break;
      case "hostile":
        adjusted += 0.2;
        break;
      case "desperate":
        adjusted -= 0.1; // Desperate passengers are easier to read
        break;
    }

    return Math.max(0.1, Math.min(0.9, adjusted));
  }

  /**
   * Utility method to shuffle array
   */
  private static shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Generates multiple variations of a passenger for different encounters
   */
  static generatePassengerVariations(
    basePassenger: Passenger,
    count: number = 3,
    playerExperience: number = 0,
  ): Passenger[] {
    const variations: Passenger[] = [];

    for (let i = 0; i < count; i++) {
      variations.push(
        this.generatePassengerVariation(
          basePassenger,
          playerExperience + i * 10,
        ),
      );
    }

    return variations;
  }

  /**
   * Determines if a passenger should use variation system based on player experience
   */
  static shouldUseVariation(playerExperience: number): boolean {
    // Start using variations after some experience to avoid overwhelming new players
    return playerExperience >= 15 && Math.random() < 0.7;
  }
}
