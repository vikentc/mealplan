import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const sessionUser = request.cookies.get('user_session')?.value;
  const { pathname } = request.nextUrl;

  // Define protected routes
  const isProtected = 
    pathname === '/planner' || 
    pathname.startsWith('/planner/') ||
    pathname === '/recipes/add' || 
    pathname.startsWith('/recipes/add/') ||
    pathname === '/shopping-list' ||
    pathname.startsWith('/shopping-list/') ||
    (pathname.startsWith('/recipes/') && pathname.endsWith('/edit'));

  if (isProtected && !sessionUser) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect logged-in users away from /login
  if (pathname === '/login' && sessionUser) {
    const redirectUrl = request.nextUrl.searchParams.get('redirectUrl') || '/';
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  return NextResponse.next();
}

// Optimization: limit the middleware execution scope
export const config = {
  matcher: [
    '/planner/:path*',
    '/recipes/add/:path*',
    '/recipes/:id/edit',
    '/shopping-list/:path*',
    '/login',
  ],
};
