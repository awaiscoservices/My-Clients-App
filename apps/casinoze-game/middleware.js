import { NextResponse } from 'next/server'

// Player site only. Staff sign in on Casinoze Support, a separate app.
const PROTECTED_ROUTES = ['/profile', '/notifications', '/dashboard']
const GUEST_ROUTES = ['/auth/login', '/auth/register']

export function middleware(request) {
  const { pathname } = request.nextUrl

  // Supabase may split the session across cookies (…-auth-token.0, .1),
  // so match by prefix.
  const isLoggedIn = request.cookies.getAll()
    .some(c => /^sb-.+-auth-token/.test(c.name) && c.value)

  const isProtected = PROTECTED_ROUTES.some(r => pathname.startsWith(r))
  const isGuestOnly = GUEST_ROUTES.some(r => pathname.startsWith(r))

  if (!isLoggedIn && isProtected) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }
  if (isLoggedIn && isGuestOnly) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/profile/:path*', '/notifications/:path*', '/dashboard/:path*', '/auth/:path*'],
}
