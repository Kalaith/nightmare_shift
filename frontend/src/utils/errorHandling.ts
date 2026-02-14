/**
 * Centralized error handling utilities for the Nightmare Shift game
 */

export class GameError extends Error {
  constructor(
    message: string,
    public code: string,
    public recoverable: boolean = true
  ) {
    super(message);
    this.name = 'GameError';
  }
}

export class ServiceError extends GameError {
  constructor(
    message: string,
    public serviceName: string,
    public operation: string
  ) {
    super(message, `${serviceName.toLowerCase()}_${operation}_failed`, true);
    this.name = 'ServiceError';
  }
}

export type GameResult<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: GameError;
      fallback?: T;
    };

export const ErrorHandling = {
  /**
   * Wraps a function that might fail and returns a Result type
   */
  wrap: <T>(fn: () => T, errorCode: string, fallback?: T): GameResult<T> => {
    try {
      const result = fn();
      return { success: true, data: result };
    } catch (error) {
      const gameError =
        error instanceof GameError
          ? error
          : new GameError(
              error instanceof Error ? error.message : 'Unknown error',
              errorCode,
              true
            );

      return {
        success: false,
        error: gameError,
        ...(fallback !== undefined && { fallback }),
      };
    }
  },

  /**
   * Safely handles null/undefined values with fallback
   */
  handleNullable: <T>(
    value: T | null | undefined,
    errorMessage: string,
    errorCode: string,
    fallback?: T
  ): GameResult<T> => {
    if (value !== null && value !== undefined) {
      return { success: true, data: value };
    }

    return {
      success: false,
      error: new GameError(errorMessage, errorCode, true),
      ...(fallback !== undefined && { fallback }),
    };
  },

  /**
   * Logs errors consistently
   * TODO: Replace with proper logging service in production
   */
  logError: (_error: GameError, _context?: string) => {
    // Error logging disabled in production
    // In development, would log: [${error.name}] ${error.code}: ${error.message}
  },

  /**
   * Creates a service error
   */
  serviceError: (serviceName: string, operation: string, message: string): ServiceError => {
    return new ServiceError(message, serviceName, operation);
  },
};

export const GameResultHelpers = {
  /**
   * Unwraps a result, throwing if it failed
   */
  unwrap: <T>(result: GameResult<T>): T => {
    if (result.success) {
      return result.data;
    }
    throw result.error;
  },

  /**
   * Gets the value or fallback from a result
   */
  unwrapOr: <T>(result: GameResult<T>, defaultValue: T): T => {
    if (result.success) {
      return result.data;
    }
    return result.fallback ?? defaultValue;
  },

  /**
   * Maps a successful result to a new value
   */
  map: <T, U>(result: GameResult<T>, fn: (value: T) => U): GameResult<U> => {
    if (result.success) {
      try {
        return { success: true, data: fn(result.data) };
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof GameError
              ? error
              : new GameError('Mapping function failed', 'map_error'),
        };
      }
    }
    return result as GameResult<U>;
  },
};
