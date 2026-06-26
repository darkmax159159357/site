/** @type {import('next').NextConfig} */
const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development", // Disable PWA in dev to avoid stale service-worker caching; stays enabled in production
  register: true,
  skipWaiting: true,
  // Improved caching strategy for images
  runtimeCaching: [
    {
      urlPattern: /\.(jpg|jpeg|png|webp|avif)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'manga-images-cache',
        expiration: {
          maxEntries: 500, // Increased cache size
          maxAgeSeconds: 14 * 24 * 60 * 60, // 14 days
        },
      },
    },
    // Add API cache for faster repeated API calls
    {
      urlPattern: /\/api\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60, // 1 hour
        },
      },
    },
    // Add font caching
    {
      urlPattern: /\/_next\/static\/fonts\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'font-cache',
        expiration: {
          maxEntries: 20,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
        },
      },
    },
    // Add static assets caching
    {
      urlPattern: /\/_next\/static\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-cache',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        },
      },
    },
  ],
});

// Import bundle analyzer for build analysis when ANALYZE flag is set
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const path = require('path');

// Always use production settings
const isProd = true;

const nextConfig = {
  // Vercel manages output automatically. 'standalone' is only for self-hosting (VPS/Docker)
  // and can break filesystem reads of public/ assets on Vercel, so we leave it off.

  // Remove console logs in production
  compiler: {
    removeConsole: {
      exclude: ['error', 'warn'], // Keep error and warning logs
    },
  },
  
  // Add config to serve static files from outside Next.js public directory
  serverRuntimeConfig: {
    // Will only be available on the server side
    medusaDir: path.join(process.cwd(), 'Medusa'),
  },
  
  // Will be available on both server and client
  publicRuntimeConfig: {
    medusaBaseUrl: '/Medusa',
  },
  
  images: {
    // Critical for local file serving
    unoptimized: true,
    
    // Create a more permissive image config
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "3000",
        pathname: "/**",
      },
      {
        protocol: "http", 
        hostname: "127.0.0.1",
        port: "3000",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "3001",
        pathname: "/**",
      },
      {
        protocol: "http", 
        hostname: "127.0.0.1",
        port: "3001",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**",
        port: "",
        pathname: "/**",
      },
    ],
    domains: ['localhost', '127.0.0.1', 'medusascans.com'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp', 'image/avif'],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    minimumCacheTTL: 60 * 60 * 24, // Increase cache TTL to 24 hours
  },
  
  // Modified redirects to prevent conflicts with error pages
  async redirects() {
    return [
      // Handle www subdomain
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.medusascans.org',
          },
        ],
        destination: 'https://medusascans.org/:path*',
        permanent: true,
      }
    ];
  },
  
  // Enhanced rewrites for better file handling
  async rewrites() {
    return {
      beforeFiles: [
        // Handle URL-encoded paths with spaces
        {
          source: '/:path*/%20:rest*',
          destination: '/:path*/ :rest*',
        }
      ],
      afterFiles: [
        // Make sure manga detail pages are handled correctly
        {
          source: '/manga/:id',
          destination: '/manga/:id',
          has: [
            {
              type: 'header',
              key: 'accept',
              value: '.*text/html.*',
            }
          ]
        },
        // Make sure read pages are handled correctly
        {
          source: '/read/:id',
          destination: '/read/:id',
        },
        // Static file access for manga files in Medusa directory
        {
          source: '/manga/:path*',
          destination: '/api/static?path=/manga/:path*',
          has: [
            {
              type: 'header',
              key: 'accept',
              value: '.*(image|application).*', // Only for images and files, not HTML
            }
          ]
        },
        // Static access to Medusa paths
        {
          source: '/Medusa/:path*',
          destination: '/api/static?path=/Medusa/:path*',
        }
      ],
      fallback: []
    };
  },
  
  // Static file configuration for Medusa with improved cache
  async headers() {
    return [
      {
        source: '/Medusa/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=43200', // Cache for 1 day, stale for 12 hours
          },
        ],
      },
      {
        source: '/manga/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=43200', // Cache for 1 day, stale for 12 hours
          },
        ],
      },
      // Add cache headers for static assets
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable', // Cache for 1 year
          },
        ],
      },
      // Add cache headers for static files
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable', // Cache for 1 year
          },
        ],
      },
      // Add content security policy headers for improved security and performance
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
        ],
      },
      // Optimize font loading
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          }
        ],
      },
    ];
  },
  
  // Disable TypeScript checking during build
  typescript: {
    ignoreBuildErrors: true,
  },
  // Disable ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable Strict Mode to prevent double rendering in development
  reactStrictMode: false,
  
  // Configure webpack to handle the UUID package correctly and optimize bundle size
  webpack: (config, { isServer }) => {
    // Fix UUID alias
    config.resolve.alias = {
      ...config.resolve.alias,
      uuid: require.resolve('uuid'),
    };
    
    // Add bundle analyzer in production build when needed
    if (process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'server',
          analyzerPort: 8888,
          openAnalyzer: true,
        })
      );
    }
    
    // Don't modify optimization settings - let Next.js handle it
    // The previous optimization config was causing conflicts
    
    return config;
  },
  
  // Simplified experimental features
  experimental: {
    // Remove optimizeCss as it can cause issues
    turbo: {
      resolveAlias: {
        // Add any module resolutions needed
      },
    },
  },
  
  // Add compression for production builds
  compress: isProd,
  
  // Simplified build ID generation
  generateBuildId: async () => {
    return `build-${Date.now()}`;
  },
  
  // Add support for gzip compression
  poweredByHeader: false,
};

// Apply the bundle analyzer wrapper and then the PWA wrapper
module.exports = withBundleAnalyzer(withPWA(nextConfig));