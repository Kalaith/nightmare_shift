import { useState, useEffect, useCallback } from 'react';
import { gameApi } from '../api/gameApi';
import type { PlayerStats } from '../types/game';
import {
  clearGuestSession,
  getFrontpageToken,
  getFrontpageUsername,
  getGuestSession,
  saveGuestSession,
} from '../auth/storage';

export interface AuthUser {
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
}

export interface AuthSessionState {
  user: AuthUser | null;
  stats: PlayerStats | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export const useAuthSession = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loginUrl, setLoginUrl] = useState<string | null>(null);

  const enrichUsername = useCallback((sessionUser: AuthUser, preferFrontpageName: boolean): AuthUser => {
    if (!preferFrontpageName) {
      return sessionUser;
    }

    const frontpageUsername = getFrontpageUsername();
    if (!frontpageUsername) {
      return sessionUser;
    }

    return {
      ...sessionUser,
      username: frontpageUsername,
      display_name: frontpageUsername,
    };
  }, []);

  const initSession = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams(window.location.search);
      const linkingGuestUserId = Number(params.get('guest_user_id') || '0');
      const frontpageToken = getFrontpageToken();
      const guestSession = getGuestSession();

      if (linkingGuestUserId > 0 && frontpageToken) {
        const linked = await gameApi.linkGuestAccount(linkingGuestUserId, frontpageToken);
        clearGuestSession();
        const linkedUser = enrichUsername(linked.user, true);
        setUser(linkedUser);
        setStats(linked.stats);
        params.delete('guest_user_id');
        const nextQuery = params.toString();
        window.history.replaceState({}, document.title, `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ''}${window.location.hash}`);
        setIsLoading(false);
        return;
      }

      if (guestSession?.token) {
        const sessionData = await gameApi.session(guestSession.token);
        const guestUser = enrichUsername(sessionData.user, false);
        saveGuestSession({ token: guestSession.token, user: guestUser });
        setUser(guestUser);
        setStats(sessionData.stats);
        setIsLoading(false);
        return;
      }

      if (frontpageToken) {
        const sessionData = await gameApi.session(frontpageToken);
        const frontpageUser = enrichUsername(sessionData.user, true);
        setUser(frontpageUser);
        setStats(sessionData.stats);
        setIsLoading(false);
        return;
      }

      setUser(null);
      setStats(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Session failed';
      console.warn('Auth session failed:', message);
      setError(message);
      setUser(null);
      setStats(null);
    } finally {
      setIsLoading(false);
    }
  }, [enrichUsername]);

  useEffect(() => {
    initSession();
  }, [initSession]);

  useEffect(() => {
    const handleLoginRequired = (event: Event) => {
      const customEvent = event as CustomEvent<{ loginUrl?: string }>;
      setLoginUrl(customEvent.detail?.loginUrl ?? null);
    };

    window.addEventListener('webhatchery:login-required', handleLoginRequired as EventListener);
    return () => window.removeEventListener('webhatchery:login-required', handleLoginRequired as EventListener);
  }, []);

  const refreshSession = useCallback(async () => {
    await initSession();
  }, [initSession]);

  const continueAsGuest = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const sessionData = await gameApi.createGuestSession();
      const guestUser = enrichUsername(sessionData.user, false);
      saveGuestSession({ token: sessionData.token, user: guestUser });
      setUser(guestUser);
      setStats(sessionData.stats);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Guest session failed';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [enrichUsername]);

  const getLinkAccountUrl = useCallback((): string => {
    const baseLoginUrl =
      loginUrl ||
      import.meta.env.VITE_WEB_HATCHERY_LOGIN_URL ||
      '/login';

    const url = new URL(baseLoginUrl, window.location.origin);
    url.searchParams.set('return_to', window.location.href);

    if (user?.is_guest && user.id) {
      url.searchParams.set('guest_user_id', String(user.id));
    }

    return url.toString();
  }, [loginUrl, user]);

  return {
    user,
    stats,
    isLoading,
    isAuthenticated: user !== null,
    error,
    refreshSession,
    continueAsGuest,
    getLinkAccountUrl,
  };
};
