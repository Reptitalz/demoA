
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
    key: 'Access-control-allow-origin',
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
  env: {
    NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY: process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY,
  },
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
  assetPrefix: '/static',
  async rewrites() {
    return [
      {
        source: '/static/:path*',
        destination: '/_next/static/:path*',
      },
    ];
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
  experimental: {
    // This is necessary to prevent bundling issues with native modules used by server-side packages.
    serverComponentsExternalPackages: ['bcrypt', 'firebase-admin'],
  },
};

module.exports = nextConfig;
