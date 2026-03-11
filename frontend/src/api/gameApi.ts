import { apiClient } from './apiClient';
import type {
  AlmanacLevel,
  GameState,
  LeaderboardEntry,
  PlayerStats,
  Rule,
  Skill,
} from '../types/game';

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
    display_name?: string;
    role?: string;
    roles?: string[];
    is_admin?: boolean;
    is_guest?: boolean;
    auth_type?: string;
    guest_user_id?: number | null;
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

export interface RouteOption {
  type: string;
  name: string;
  description: string;
  fuelCost: number;
  timeCost: number;
  available: boolean;
  bonusInfo?: string;
  colorClass: string;
  riskDisplay: {
    visible: boolean;
    level?: number;
    color?: 'amber' | 'yellow' | 'gray';
  };
  fareBonusDisplay: {
    visible: boolean;
    percentage?: number;
    color?: 'emerald' | 'rose';
  };
}

export interface AdminSessionSummary {
  sessionId: string;
  userId: number;
  username: string;
  eventCount: number;
  startedAt: string;
  lastEventAt: string;
  latestEventType: string;
  gamePhase: string;
  fuel: number;
  earnings: number;
  timeRemaining: number;
  ridesCompleted: number;
}

export interface AdminSessionEvent {
  id: number;
  sessionId: string;
  userId: number;
  username: string;
  eventType: string;
  gamePhase: string;
  eventData: Record<string, unknown>;
  stateSnapshot: Record<string, unknown>;
  createdAt: string;
}

export const gameApi = {
  async session(token?: string): Promise<SessionData> {
    const res = await apiClient.post<BackendResponse<SessionData>>(
      '/auth/session',
      {},
      token
        ? {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        : undefined
    );
    return res.data.data;
  },

  async createGuestSession(): Promise<{ token: string; user: SessionData['user']; stats: PlayerStats }> {
    const res = await apiClient.post<
      BackendResponse<{ token: string; user: SessionData['user']; stats: PlayerStats }>
    >('/auth/guest-session');
    return res.data.data;
  },

  async linkGuestAccount(guestUserId: number, token: string): Promise<SessionData> {
    const res = await apiClient.post<BackendResponse<SessionData>>(
      '/auth/link-guest',
      { guest_user_id: guestUserId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return res.data.data;
  },

  async startShift(): Promise<GameState> {
    const res = await apiClient.post<BackendResponse<GameState>>('/game/start-shift');
    return res.data.data;
  },

  async requestPassenger(): Promise<GameState> {
    const res = await apiClient.post<BackendResponse<GameState>>('/game/request-passenger');
    return res.data.data;
  },

  async declineRide(): Promise<GameState> {
    const res = await apiClient.post<BackendResponse<GameState>>('/game/decline-ride');
    return res.data.data;
  },

  async drivingChoice(routeType: string, phase: string): Promise<GameState> {
    const res = await apiClient.post<BackendResponse<GameState>>('/game/driving-choice', {
      routeType,
      phase,
    });
    return res.data.data;
  },

  async interaction(action: string): Promise<GameState> {
    const res = await apiClient.post<BackendResponse<GameState>>('/game/interaction', {
      action,
    });
    return res.data.data;
  },

  async completeRide(isPositive: boolean = true): Promise<GameState> {
    const res = await apiClient.post<BackendResponse<GameState>>('/game/complete-ride', {
      isPositive,
    });
    return res.data.data;
  },

  async endShift(): Promise<ShiftResult> {
    const res = await apiClient.post<BackendResponse<ShiftResult>>('/game/end-shift');
    return res.data.data;
  },

  async saveGame(gameState: GameState): Promise<void> {
    await apiClient.post('/game/save', { gameState });
  },

  async loadGame(): Promise<GameState | null> {
    const res = await apiClient.get<BackendResponse<GameState | null>>('/game/load');
    return res.data.data;
  },

  async refuel(mode: 'full' | 'partial'): Promise<GameState> {
    const res = await apiClient.post<BackendResponse<GameState>>('/game/refuel', { mode });
    return res.data.data;
  },

  async getRouteOptions(): Promise<RouteOption[]> {
    const res = await apiClient.get<BackendResponse<RouteOption[]>>('/game/route-options');
    return res.data.data;
  },

  async getDailyRules(): Promise<Rule[]> {
    const res = await apiClient.get<BackendResponse<Rule[]>>('/game/daily-rules');
    return res.data.data;
  },

  async getStats(): Promise<PlayerStats | null> {
    const res = await apiClient.get<BackendResponse<PlayerStats | null>>('/player/stats');
    return res.data.data;
  },

  async purchaseSkill(skillId: string): Promise<PlayerStats> {
    const res = await apiClient.post<BackendResponse<PlayerStats>>('/player/purchase-skill', {
      skill_id: skillId,
    });
    return res.data.data;
  },

  async upgradeAlmanac(passengerId: number): Promise<PlayerStats> {
    const res = await apiClient.post<BackendResponse<PlayerStats>>('/player/upgrade-almanac', {
      passenger_id: passengerId,
    });
    return res.data.data;
  },

  async getSkills(): Promise<Skill[]> {
    const res = await apiClient.get<BackendResponse<Skill[]>>('/content/skills');
    return res.data.data;
  },

  async getAlmanacLevels(): Promise<AlmanacLevel[]> {
    const res = await apiClient.get<BackendResponse<AlmanacLevel[]>>('/content/almanac-levels');
    return res.data.data;
  },

  async getLeaderboard(limit: number = 20): Promise<LeaderboardEntry[]> {
    const res = await apiClient.get<BackendResponse<Record<string, unknown>[]>>(
      '/player/leaderboard',
      { params: { limit } }
    );
    return (res.data.data ?? []).map(row => ({
      id: Number(row.id ?? 0),
      userId: Number(row.user_id ?? 0),
      username: (row.username as string) ?? null,
      score: Number(row.score ?? 0),
      timeRemaining: Number(row.time_remaining ?? 0),
      date: String(row.played_at ?? ''),
      playedAt: String(row.played_at ?? ''),
      survived: Boolean(row.survived),
      passengersTransported: Number(row.passengers_transported ?? 0),
      difficultyLevel: Number(row.difficulty_level ?? 0),
      rulesViolated: Number(row.rules_violated ?? 0),
    }));
  },

  async getAlmanac(): Promise<Record<number, unknown>> {
    const res = await apiClient.get<BackendResponse<Record<number, unknown>>>('/player/almanac');
    return res.data.data;
  },

  async getAdminSessions(limit: number = 50): Promise<AdminSessionSummary[]> {
    const res = await apiClient.get<BackendResponse<AdminSessionSummary[]>>('/admin/sessions', {
      params: { limit },
    });
    return res.data.data;
  },

  async getAdminSession(sessionId: string): Promise<AdminSessionEvent[]> {
    const res = await apiClient.get<BackendResponse<AdminSessionEvent[]>>('/admin/session', {
      params: { session_id: sessionId },
    });
    return res.data.data;
  },
};

export type { BackendResponse, SessionData, ShiftResult };
