const KEYS = {
  user: 'user',
  token: 'token',
  tokenExpiresAt: 'token_expires_at',
} as const;

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const expRaw = localStorage.getItem(KEYS.tokenExpiresAt);
    if (expRaw) {
      const ms = Date.parse(expRaw);
      if (!Number.isNaN(ms) && Date.now() >= ms) {
        clearStoredAuth();
        return null;
      }
    }
    const token = localStorage.getItem(KEYS.token);
    if (!token) {
      if (localStorage.getItem(KEYS.user) || expRaw) clearStoredAuth();
      return null;
    }
    return token;
  } catch {
    return null;
  }
}

export function getStoredUserJson(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(KEYS.user);
  } catch {
    return null;
  }
}

export function setStoredAuth(
  userJson: string,
  token: string,
  expiresAtIso: string,
): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEYS.user, userJson);
  localStorage.setItem(KEYS.token, token);
  localStorage.setItem(KEYS.tokenExpiresAt, expiresAtIso);
}

export function clearStoredAuth(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEYS.user);
  localStorage.removeItem(KEYS.token);
  localStorage.removeItem(KEYS.tokenExpiresAt);
}
