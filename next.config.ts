import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React strict mode to detect potential issues
  reactStrictMode: true,

  // Remove X-Powered-By header for security
  poweredByHeader: false,

  // Automatically compress responses
  compress: true,

  // Disable source maps in production to reduce bundle size
  productionBrowserSourceMaps: false,

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              // Default: only load resources from same origin
              "default-src 'self'",
              // Scripts: Next.js requires 'unsafe-inline' for hydration and 'unsafe-eval' for dev mode
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              // Styles: allow inline styles (Tailwind, shadcn/ui)
              "style-src 'self' 'unsafe-inline'",
              // Images: allow same origin, data URIs, and external servers (Emby)
              "img-src 'self' data: https: http:",
              // Fonts: allow same origin and data URIs
              "font-src 'self' data:",
              // Connections: allow API calls to any server (Emby is dynamic)
              "connect-src 'self' https: http:",
              // Frames: disallow iframes
              "frame-src 'none'",
              // Objects: disallow <object>, <embed>
              "object-src 'none'",
              // Base URI: prevent base tag injection attacks
              "base-uri 'self'",
              // Form actions: only to same origin
              "form-action 'self'",
            ].join("; "),
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
