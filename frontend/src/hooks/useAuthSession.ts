import { useState, useEffect, useCallback } from 'react';
import { gameApi } from '../api/gameApi';
import type { PlayerStats } from '../types/game';

export interface AuthUser {
    id: number;
    wh_user_id: number;
    email: string;
    username: string;
}

export interface AuthSessionState {
    user: AuthUser | null;
    stats: PlayerStats | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    error: string | null;
}

/**
 * Auth session hook — calls /auth/session on mount to validate JWT
 * and retrieve the logged-in user + their stats from the backend.
 */
export const useAuthSession = () => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [stats, setStats] = useState<PlayerStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const initSession = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const sessionData = await gameApi.session();

            // Read the WH username from auth-storage (same pattern as Blacksmith Forge)
            let whUsername: string | undefined;
            try {
                const raw = localStorage.getItem('auth-storage');
                if (raw) {
                    const parsed = JSON.parse(raw);
                    whUsername = parsed?.state?.user?.username;
                }
            } catch { /* silent */ }

            // Override backend username with WH username if available
            if (whUsername && sessionData.user) {
                sessionData.user.username = whUsername;
            }

            setUser(sessionData.user);
            setStats(sessionData.stats);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Session failed';
            console.warn('Auth session failed:', message);
            setError(message);
            setUser(null);
            setStats(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Call session on mount
    useEffect(() => {
        initSession();
    }, [initSession]);

    const refreshSession = useCallback(async () => {
        await initSession();
    }, [initSession]);

    return {
        user,
        stats,
        isLoading,
        isAuthenticated: user !== null,
        error,
        refreshSession,
    };
};
