import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;
  const { pathname } = request.nextUrl;

  // Paths that should not be accessible if the user is already authenticated
  const authPaths = ['/login', '/signup', '/'];

  if (token && authPaths.includes(pathname)) {
    // If authenticated, redirect away from landing/login/signup to the dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

// Config to only run middleware on specific auth-related paths
export const config = {
  matcher: ['/', '/login', '/signup'],
};
