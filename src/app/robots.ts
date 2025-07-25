import { type MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002';

// This function generates the robots.txt file, which gives instructions to web crawlers.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // Applies to all user-agents (all bots, like Googlebot, Bingbot, etc.).
        userAgent: '*',
        // Allows crawlers to access all parts of the site. This is a good default.
        allow: '/',
        // Explicitly disallows access to private API routes to prevent them from being crawled.
        disallow: [
          '/api/', // Disallow all API routes
        ],
      },
    ],
    // Provides the URL to your sitemap, helping bots discover all your important pages.
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
