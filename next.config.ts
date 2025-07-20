
import type {NextConfig} from 'next';

const securityHeaders = [
  // Prevents browsers from incorrectly guessing content types.
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  // Prevents the page from being rendered in an iframe, which can help prevent clickjacking attacks.
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  // Enforces the use of HTTPS (HSTS).
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  // Instructs browsers to not cache content. This is useful for development to always see the latest changes.
  {
    key: 'Cache-Control',
    value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
  },
  {
    key: 'Pragma',
    value: 'no-cache',
  },
  {
    key: 'Expires',
    value: '0',
  },
];


const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      }
    ],
  },
  async headers() {
    return [
      {
        // Apply these headers to all routes in your application.
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
