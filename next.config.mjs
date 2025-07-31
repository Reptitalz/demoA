
import withPWAInit from "@ducanh2912/next-pwa";
import type { Configuration as WebpackConfiguration } from 'webpack';

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
  // CORS Headers
  {
    key: 'Access-Control-Allow-Credentials',
    value: 'true',
  },
  {
    key: 'Access-Control-Allow-Origin',
    value: '*', // Replace with your actual domain in production for better security
  },
  {
    key: 'Access-Control-Allow-Methods',
    value: 'GET,DELETE,PATCH,POST,PUT',
  },
  {
    key: 'Access-Control-Allow-Headers',
    value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
  },
];

const nextConfig = {
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
  webpack: (
    config: WebpackConfiguration,
    { isServer }: { isServer: boolean }
  ): WebpackConfiguration => {
    if (!isServer) {
      // Initialize resolve and fallback if they don't exist to prevent errors
      if (!config.resolve) {
        config.resolve = {};
      }
      if (!config.resolve.fallback) {
        config.resolve.fallback = {}; // Ensure fallback is an object
      }

      // Add fallbacks for Node.js core modules.
      // This prevents "Module not found" errors for these modules on the client-side,
      // as database operations are handled by Server Actions.
      config.resolve.fallback = {
        ...config.resolve.fallback, // Preserve existing fallbacks if any
        "child_process": false,
        "fs": false,
        "net": false,
        "tls": false,
        "dns": false,
        // The 'mongodb-client-encryption' module is problematic for client bundles
        // as it depends on 'child_process'. Marking it as false prevents bundling.
        "mongodb-client-encryption": false,
      };
    }
    return config;
  },
};


const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

export default withPWA(nextConfig);
