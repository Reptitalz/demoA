
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
  const isProtectedRoute = 
      pathname.startsWith('/app') || // The assistant setup/reconfiguration process
      pathname.startsWith('/dashboard') ||
      pathname.startsWith('/chat/admin') || // The new admin section in chat
      pathname.startsWith('/chat/dashboard') || // The new chat dashboard
      pathname.startsWith('/colaboradores/dashboard'); // The collaborator dashboard

  // The base /chat route should be public, but it's caught by the matcher.
  // We explicitly exclude it from the protected check.
  if (pathname === '/chat') {
    return NextResponse.next();
  }

  if (isProtectedRoute) {
    const token = await getToken({ req, secret, raw: true });

    if (!token) {
      // If no token, redirect to the relevant login page
      let loginUrl;
      if (pathname.startsWith('/colaboradores')) {
        loginUrl = new URL('/colaboradores/login', req.url);
      } else if (pathname.startsWith('/chat')) {
        loginUrl = new URL('/chat', req.url); // Redirect to the new chat landing page
      } else {
        loginUrl = new URL('/login', req.url);
      }
        
      loginUrl.searchParams.set('callbackUrl', req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Allow access to other pages like the base /chat for unauthenticated users,
  // the pages themselves will handle showing demo content or login prompts.
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    // We still match all dashboard and chat routes to run the middleware, 
    // but the logic inside decides what to do.
    '/dashboard/:path*', 
    '/chat/:path*',
    '/app/:path*',
    '/colaboradores/dashboard/:path*'
],
};
