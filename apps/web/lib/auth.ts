
export interface JWTPayload {
  email: string;
  sub: string;
  iat: number;
  exp: number;
  role: string;
  tenantId: string;
  permissions?: string[];
  [key: string]: unknown;
}

/**
 * Decodes a JWT payload without verifying the signature.
 * Safe for client-side use to check expiration or read user info.
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/**
 * Checks if a JWT is expired.
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) return true;
  
  // payload.exp is in seconds, Date.now() is in milliseconds
  return Date.now() >= payload.exp * 1000;
}

/**
 * Clears both access and refresh tokens.
 */
export function logout() {
  document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; samesite=lax';
  document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; samesite=lax';
  window.location.href = '/login';
}

/**
 * Attempts to refresh the access token using the refresh token.
 */
export async function refreshToken(): Promise<boolean> {
  try {
    const refreshToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('refresh_token='))
      ?.split('=')[1];

    if (!refreshToken) return false;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const response = await fetch(`${apiUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) return false;

    const data = await response.json();
    
    // Update cookies with new tokens
    document.cookie = `access_token=${data.access_token}; path=/; max-age=3600; samesite=lax`;
    document.cookie = `refresh_token=${data.refresh_token}; path=/; max-age=604800; samesite=lax`;

    return true;
  } catch (error) {
    console.error('Failed to refresh token:', error);
    return false;
  }
}

/**
 * Signs in against the API and stores the session cookies.
 *
 * Shared by the sign-in form and the demo role switcher so there is one place
 * that knows how a session is established and where a given user lands — two
 * copies of that would drift the moment one of them gained a redirect case.
 *
 * Returns the path to send the browser to; throws with the API's message on
 * failure so the caller can surface it.
 */
export async function signIn(
  email: string,
  password: string,
): Promise<string> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const response = await fetch(`${apiUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Login failed');
  }

  document.cookie = `access_token=${data.access_token}; path=/; max-age=3600; samesite=lax`;
  document.cookie = `refresh_token=${data.refresh_token}; path=/; max-age=604800; samesite=lax`;

  if (data.mustChangePassword) return '/change-password';
  return data.isOnboarded ? '/dashboard' : '/onboarding';
}
