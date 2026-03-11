export interface GuestSessionUser {
  id: number;
  wh_user_id: number;
  email?: string;
  username?: string;
  display_name?: string;
  is_guest?: boolean;
  auth_type?: string;
  guest_user_id?: number | null;
}

export interface GuestSessionData {
  token: string;
  user: GuestSessionUser;
}

export const WEBHATCHERY_AUTH_STORAGE_KEY = 'auth-storage';
export const NIGHTMARE_SHIFT_GUEST_STORAGE_KEY = 'nightmare-shift-guest-session';

export const getFrontpageToken = (): string | null => {
  try {
    const raw = localStorage.getItem(WEBHATCHERY_AUTH_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as { state?: { token?: string | null } };
    return parsed.state?.token ?? null;
  } catch {
    return null;
  }
};

export const getFrontpageUsername = (): string | undefined => {
  try {
    const raw = localStorage.getItem(WEBHATCHERY_AUTH_STORAGE_KEY);
    if (!raw) {
      return undefined;
    }

    const parsed = JSON.parse(raw) as { state?: { user?: { username?: string } } };
    return parsed.state?.user?.username;
  } catch {
    return undefined;
  }
};

export const persistLoginUrl = (loginUrl: string): void => {
  try {
    const raw = localStorage.getItem(WEBHATCHERY_AUTH_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    const state = parsed?.state ?? {};
    const next = {
      ...parsed,
      state: {
        ...state,
        loginUrl,
      },
    };

    localStorage.setItem(WEBHATCHERY_AUTH_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage errors. The interceptor already reports them elsewhere.
  }
};

export const getGuestSession = (): GuestSessionData | null => {
  try {
    const raw = localStorage.getItem(NIGHTMARE_SHIFT_GUEST_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as GuestSessionData) : null;
  } catch {
    return null;
  }
};

export const saveGuestSession = (session: GuestSessionData): void => {
  localStorage.setItem(NIGHTMARE_SHIFT_GUEST_STORAGE_KEY, JSON.stringify(session));
};

export const clearGuestSession = (): void => {
  localStorage.removeItem(NIGHTMARE_SHIFT_GUEST_STORAGE_KEY);
};

export const getActiveToken = (): string | null => {
  const guestSession = getGuestSession();
  if (guestSession?.token) {
    return guestSession.token;
  }

  return getFrontpageToken();
};
