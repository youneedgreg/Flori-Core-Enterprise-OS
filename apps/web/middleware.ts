import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Basic JWT expiration check for Next.js Middleware (Edge Runtime)
 */
function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (!payload.exp) return true;
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;
  const { pathname } = request.nextUrl;

  // Paths that should not be accessible if the user is already authenticated
  const authPaths = ['/login', '/signup', '/'];
  
  // Dashboard and protected routes
  const isDashboardRoute = pathname.startsWith('/dashboard');

  if (token) {
    const expired = isTokenExpired(token);
    
    if (expired) {
      // If token is expired, clear it and redirect to login if we're on a dashboard route
      if (isDashboardRoute) {
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('access_token');
        return response;
      }
    } else if (authPaths.includes(pathname)) {
      // If authenticated and not expired, redirect away from login/signup to dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  } else if (isDashboardRoute) {
    // If no token and trying to access dashboard, redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

// Config to run middleware on auth-related paths AND dashboard routes
export const config = {
  matcher: ['/', '/login', '/signup', '/dashboard/:path*'],
};
