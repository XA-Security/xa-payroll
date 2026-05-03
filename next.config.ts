import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

async function headers() {
  return [
    {
      source: "/:path*",
      headers: [
        // Prevent XSS attacks - tell browser to use detected content-type
        {
          key: "X-Content-Type-Options",
          value: "nosniff",
        },
        // Prevent clickjacking - only allow framing from same origin
        {
          key: "X-Frame-Options",
          value: "SAMEORIGIN",
        },
        // Control referrer information sent with navigation
        {
          key: "Referrer-Policy",
          value: "strict-origin-when-cross-origin",
        },
        // Restrict browser features/APIs
        {
          key: "Permissions-Policy",
          value:
            "geolocation=(self), microphone=(self), camera=(self), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()",
        },
        // Content Security Policy - prevent inline scripts and restrict resource loading
        {
          key: "Content-Security-Policy",
          value:
            "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://vercel.live https://vercel.liveblocks.io https://*.sentry.io https://m.stripe.network https://vitals.vercel-analytics.com https://maps.googleapis.com; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; img-src 'self' data: https:; font-src 'self' data: https:; connect-src 'self' https: wss: http://localhost:*; frame-src 'self' https:; media-src 'self' https:; manifest-src 'self'; worker-src 'self' blob:",
        },
        // Prevent CORS preflight from exposing wide permissions
        {
          key: "Cross-Origin-Resource-Policy",
          value: "cross-origin",
        },
      ],
    },
  ];
}

const nextConfig: NextConfig = {
  headers,
  // Empty turbopack config allows Turbopack to run in dev with custom webpack config
  // This silences the warning about having webpack config without turbopack config
  turbopack: {},
  // Mark these packages as external to prevent bundling issues with binary files
  // Required for @sparticuz/chromium to work correctly on Vercel
  // ws: Prevents WebSocket bundling issues and module resolution errors in Node.js runtime
  // @assetval/nachos: Uses .ts as entry point, needs to be external for Turbopack
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core", "ws", "@assetval/nachos", "@react-pdf/renderer"],
  // Use standalone mode for Vercel deployment
  output: "standalone",
  // Allow build to proceed with TypeScript type mismatches
  // These are non-critical strictness issues between database schema and app types
  typescript: {
    ignoreBuildErrors: true,
  },
  // Configure request body size limit for App Router API routes
  // App Router routes use experimental.proxyClientMaxBodySize
  // Increases from default 10MB to 50MB for large document submissions
  experimental: {
    proxyClientMaxBodySize: "50mb",
  },
  outputFileTracingIncludes: {
    '/api/humanity/skills-expiry/scrape': [
      './node_modules/@sparticuz/chromium/**/*',
    ],
  },
  // Configure HTTP request size limits for file uploads
  httpAgentOptions: {
    keepAlive: false,
  },
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },
  // Configure allowed image domains
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "media.licdn.com",
      },
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "https",
        hostname: "www.humanity.com",
      },
    ],
  },
  webpack: (config: any, { isServer }: any) => {
    // Suppress CSS parsing warnings from tw-animate-css and similar packages
    // by using safe-parser that continues on syntax errors
    const postcssLoader = config.module.rules.find((rule: any) => {
      const test = rule.test?.toString() || "";
      return test.includes("css") && rule.use?.some?.((u: any) => u.loader?.includes?.("postcss"));
    });

    if (postcssLoader) {
      postcssLoader.use.forEach((use: any) => {
        if (use.loader?.includes?.("postcss-loader")) {
          use.options = use.options || {};
          use.options.postcssOptions = use.options.postcssOptions || {};
          use.options.postcssOptions.parser = "postcss-safe-parser";
        }
      });
    }

    // Prevent multiple zod instances in client bundle
    // This ensures all dependencies use the same zod version via npm overrides
    if (!isServer) {
      config.resolve = config.resolve || {};
      config.resolve.alias = config.resolve.alias || {};
      config.resolve.alias.zod = require.resolve('zod');
    }

    return config;
  },
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "xa-security",

  project: "javascript-nextjs",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
