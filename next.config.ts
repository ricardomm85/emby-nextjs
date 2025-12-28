import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              // Default: solo cargar recursos del mismo origen
              "default-src 'self'",
              // Scripts: Next.js requiere 'unsafe-inline' para hydration y 'unsafe-eval' para dev mode
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              // Estilos: permitir inline styles (Tailwind, shadcn/ui)
              "style-src 'self' 'unsafe-inline'",
              // Imágenes: permitir mismo origen, data URIs, y servidores externos (Emby)
              "img-src 'self' data: https: http:",
              // Fuentes: permitir mismo origen y data URIs
              "font-src 'self' data:",
              // Conexiones: permitir API calls a cualquier servidor (Emby es dinámico)
              "connect-src 'self' https: http:",
              // Frames: no permitir iframes
              "frame-src 'none'",
              // Objetos: no permitir <object>, <embed>
              "object-src 'none'",
              // Base URI: prevenir ataques de base tag injection
              "base-uri 'self'",
              // Form actions: solo al mismo origen
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
