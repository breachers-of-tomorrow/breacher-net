import type { NextConfig } from "next";

/**
 * Security headers — defense in depth at the origin.
 *
 * Cloudflare handles HSTS and some headers at the edge, but the origin
 * should set its own headers for direct-access and belt-and-suspenders.
 */
const securityHeaders = [
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
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next.js requires 'unsafe-inline' for styles (CSS-in-JS, recharts inline SVG styles)
      // 'unsafe-eval' NOT included — scripts are locked down
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      // Images: self, data URIs (SVG), cryoarchive CDN
      "img-src 'self' data: https://cryoarchive.systems",
      // YouTube embeds for index entries
      "frame-src https://www.youtube.com",
      // Fonts: self only (next/font/google self-hosts)
      "font-src 'self'",
      // API connections to self only
      "connect-src 'self'",
      // No object/embed
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,

  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
