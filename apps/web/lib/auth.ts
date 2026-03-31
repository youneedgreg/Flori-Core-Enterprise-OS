
export interface JWTPayload {
  email: string;
  sub: string;
  iat: number;
  exp: number;
  role: string;
  tenantId: string;
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
 * Clears the access token cookie.
 */
export function logout() {
  document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; samesite=lax';
  window.location.href = '/login';
}
