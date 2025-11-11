/**
 * Simple admin authentication utility
 * Password verification moved to server-side API for security
 */

const AUTH_TOKEN_KEY = 'exnews_admin_auth';
const AUTH_TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

export interface AuthToken {
  token: string;
  expiresAt: number;
}

/**
 * Verify password via server-side API
 * @param password - Password to verify
 * @returns Promise that resolves to true if password is correct
 */
export const verifyPassword = async (password: string): Promise<boolean> => {
  try {
    const response = await fetch('/api/admin/verify-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password }),
    });

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
};

/**
 * Generate and store auth token
 */
export const setAuthToken = (): void => {
  if (typeof window === 'undefined') return;

  const token = `admin_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  const authData: AuthToken = {
    token,
    expiresAt: Date.now() + AUTH_TOKEN_EXPIRY
  };

  localStorage.setItem(AUTH_TOKEN_KEY, JSON.stringify(authData));
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;

  const stored = localStorage.getItem(AUTH_TOKEN_KEY);
  if (!stored) return false;

  try {
    const authData: AuthToken = JSON.parse(stored);

    // Check if token is expired
    if (Date.now() > authData.expiresAt) {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      return false;
    }

    return true;
  } catch {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    return false;
  }
};

/**
 * Clear authentication
 */
export const clearAuth = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
};

/**
 * Get remaining time until expiry (in milliseconds)
 */
export const getAuthTimeRemaining = (): number => {
  if (typeof window === 'undefined') return 0;

  const stored = localStorage.getItem(AUTH_TOKEN_KEY);
  if (!stored) return 0;

  try {
    const authData: AuthToken = JSON.parse(stored);
    const remaining = authData.expiresAt - Date.now();
    return remaining > 0 ? remaining : 0;
  } catch {
    return 0;
  }
};
