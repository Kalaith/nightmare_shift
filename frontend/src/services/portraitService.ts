/**
 * Portrait Service - Handles character portrait image management
 * Provides utilities for displaying character images in the game UI
 */

export class PortraitService {
  /**
   * Mapping of passenger names to their image prompt IDs
   * Based on imagePrompts.json structure
   */
  private static readonly passengerIdMap: Record<string, number> = {
    "Mrs. Chen": 1,
    "Jake Morrison": 2,
    "Sarah Woods": 3,
    "Dr. Hollow": 4,
    "The Collector": 5,
    "Tommy Sullivan": 6,
    "Elena Vasquez": 7,
    "Marcus Thompson": 8,
    "Nurse Catherine": 9,
    "Old Pete": 10,
    "Madame Zelda": 11,
    "Frank the Pianist": 12,
    "Sister Agnes": 13,
    "Detective Morrison": 14,
    "The Midnight Mayor": 15,
    "Death's Taxi Driver": 16
  };

  /**
   * Get the portrait image path for a passenger
   * Uses ID-based filenames (e.g. "1.jpg", "2.jpg") from assets
   */
  static getPortraitPath(passengerName: string): string {
    const id = this.passengerIdMap[passengerName];
    if (!id) {
      return '';
    }
    return `/nightmare_shift/assets/${id}.png`;
  }

  /**
   * Get portrait with fallback to emoji if image fails to load
   */
  static getPortraitWithFallback(passengerName: string, emoji: string): {
    imageSrc: string;
    alt: string;
    fallbackEmoji: string;
  } {
    return {
      imageSrc: this.getPortraitPath(passengerName),
      alt: `${passengerName} portrait`,
      fallbackEmoji: emoji
    };
  }

  /**
   * Check if a portrait exists (can be used for conditional rendering)
   */
  static hasPortrait(passengerName: string): boolean {
    return passengerName in this.passengerIdMap;
  }

  /**
   * Get thumbnail size portrait path (if you create different sizes)
   */
  static getThumbnailPath(passengerName: string): string {
    const id = this.passengerIdMap[passengerName];
    if (!id) return '';
    return `/nightmare_shift/assets/${id}_thumb.png`;
  }

  /**
   * Get full size portrait path for detailed views
   */
  static getFullSizePath(passengerName: string): string {
    const id = this.passengerIdMap[passengerName];
    if (!id) return '';
    return `/nightmare_shift/assets/${id}_full.png`;
  }

  /**
   * Get the image prompt ID for a passenger name
   */
  static getPassengerId(passengerName: string): number | undefined {
    return this.passengerIdMap[passengerName];
  }
}