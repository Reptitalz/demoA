
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const secret = process.env.NEXTAUTH_SECRET;

  // The demo dashboard should be public, so the matcher should not run on it.
  // This logic runs for all paths defined in the matcher.
  
  if (!secret) {
    console.error("Missing NEXTAUTH_SECRET in .env.local");
    return new NextResponse('Internal Server Error', { status: 500 });
  }

  const token = await getToken({ req, secret, raw: true });

  if (!token) {
    // If no token, redirect to the relevant login page
    const loginUrl = pathname.startsWith('/colaboradores') 
      ? new URL('/colaboradores/login', req.url)
      : new URL('/login', req.url);
      
    loginUrl.searchParams.set('callbackUrl', req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
// We use a negative lookahead to exclude the /demo path.
export const config = {
  matcher: [
    '/dashboard/:path*', 
    '/app/:path*',
    '/colaboradores/dashboard/:path*'
],
};
