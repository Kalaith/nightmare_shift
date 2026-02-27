import { apiClient } from './apiClient';
import type { GameState, PlayerStats } from '../types/game';

// ─── Response Types ─────────────────────────────────────────────────
interface BackendResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
}

interface SessionData {
  user: {
    id: number;
    wh_user_id: number;
    email: string;
    username: string;
  };
  stats: PlayerStats;
}

interface ShiftResult {
  score: number;
  earnings: number;
  ridesCompleted: number;
  timeSpent: number;
  rulesViolated: number;
  survived: boolean;
  difficultyLevel: number;
}

interface RouteOption {
  type: string;
  name: string;
  description: string;
  fuelCost: number;
  timeCost: number;
  riskLevel: number;
  available: boolean;
  passengerReaction?: string;
  fareModifier?: number;
}

interface LeaderboardEntry {
  id: number;
  user_id: number;
  score: number;
  time_remaining: number;
  passengers_transported: number;
  difficulty_level: number;
  rules_violated: number;
  survived: boolean;
  played_at: string;
  username: string | null;
}

// ─── API Service ────────────────────────────────────────────────────

/**
 * Game API service — all backend communication goes through here.
 * Each method maps 1:1 to a backend endpoint.
 */
export const gameApi = {
  // ─── Auth ───────────────────────────────────────────────────────
  /** Validate JWT session and get/create user profile + stats */
  async session(): Promise<SessionData> {
    const res = await apiClient.post<BackendResponse<SessionData>>('/auth/session');
    return res.data.data;
  },

  // ─── Game Lifecycle ──────────────────────────────────────────────
  /** Start a new shift — returns full initial game state */
  async startShift(): Promise<GameState> {
    const res = await apiClient.post<BackendResponse<GameState>>('/game/start-shift');
    return res.data.data;
  },

  /** Request the next passenger */
  async requestPassenger(): Promise<GameState> {
    const res = await apiClient.post<BackendResponse<GameState>>('/game/request-passenger');
    return res.data.data;
  },

  /** Submit a driving route choice */
  async drivingChoice(routeType: string, phase: string): Promise<GameState> {
    const res = await apiClient.post<BackendResponse<GameState>>('/game/driving-choice', {
      routeType,
      phase,
    });
    return res.data.data;
  },

  /** Submit a passenger interaction action */
  async interaction(action: string): Promise<GameState> {
    const res = await apiClient.post<BackendResponse<GameState>>('/game/interaction', {
      action,
    });
    return res.data.data;
  },

  /** Complete the current ride */
  async completeRide(isPositive: boolean = true): Promise<GameState> {
    const res = await apiClient.post<BackendResponse<GameState>>('/game/complete-ride', {
      isPositive,
    });
    return res.data.data;
  },

  /** End the shift — returns score summary */
  async endShift(): Promise<ShiftResult> {
    const res = await apiClient.post<BackendResponse<ShiftResult>>('/game/end-shift');
    return res.data.data;
  },

  /** Save current game state */
  async saveGame(gameState: GameState): Promise<void> {
    await apiClient.post('/game/save', { gameState });
  },

  /** Load saved game state */
  async loadGame(): Promise<GameState | null> {
    const res = await apiClient.get<BackendResponse<GameState | null>>('/game/load');
    return res.data.data;
  },

  /** Get available route options */
  async getRouteOptions(fuel: number, time: number): Promise<Record<string, RouteOption>> {
    const res = await apiClient.get<BackendResponse<Record<string, RouteOption>>>(
      '/game/route-options',
      { params: { fuel, time } }
    );
    return res.data.data;
  },

  // ─── Player Data ──────────────────────────────────────────────────
  /** Get player statistics */
  async getStats(): Promise<PlayerStats | null> {
    const res = await apiClient.get<BackendResponse<PlayerStats | null>>('/player/stats');
    return res.data.data;
  },

  /** Get skill tree config from the backend */
  async getSkills(): Promise<Skill[]> {
    const res = await apiClient.get<BackendResponse<Skill[]>>('/content/skills');
    return res.data.data;
  },

  /** Get global leaderboard */
  async getLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
    const res = await apiClient.get<BackendResponse<LeaderboardEntry[]>>(
      '/player/leaderboard',
      { params: { limit } }
    );
    return res.data.data;
  },

  /** Get passenger almanac entries */
  async getAlmanac(): Promise<Record<number, unknown>> {
    const res = await apiClient.get<BackendResponse<Record<number, unknown>>>('/player/almanac');
    return res.data.data;
  },
};

export type { SessionData, ShiftResult, RouteOption, LeaderboardEntry, BackendResponse };
