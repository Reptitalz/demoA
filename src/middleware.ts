
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const secret = process.env.NEXTAUTH_SECRET;

  if (!secret) {
    console.error("Missing NEXTAUTH_SECRET in .env.local");
    return new NextResponse('Internal Server Error', { status: 500 });
  }

  // Define protected routes that STRICTLY require authentication
  const isDashboardRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/app');
  const isChatRoute = pathname.startsWith('/chat/dashboard') || pathname.startsWith('/chat/admin') || pathname.startsWith('/chat/conversation');

  if (isDashboardRoute) {
    const token = await getToken({ req, secret, raw: true });
    if (!token) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('callbackUrl', req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (isChatRoute) {
    const token = await getToken({ req, secret, raw: true });
    if (!token) {
      const loginUrl = new URL('/chat', req.url); // The landing/login for chat app is /chat
      loginUrl.searchParams.set('callbackUrl', req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Allow access to other pages like marketing, /chat itself, etc.
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    '/dashboard/:path*', 
    '/app/:path*',
    '/chat/dashboard/:path*',
    '/chat/admin/:path*',
    '/chat/conversation/:path*',
    '/colaboradores/dashboard/:path*' // Collaborator routes remain the same
],
};
