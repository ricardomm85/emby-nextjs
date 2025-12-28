import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { rateLimit, getRequestIdentifier } from "@/lib/rate-limit";

export function middleware(request: NextRequest) {
  const identifier = getRequestIdentifier(request);

  // Rate limiting por endpoint
  if (request.nextUrl.pathname === "/api/auth") {
    // Login: 1 intento por minuto
    const { allowed, remaining, resetTime } = rateLimit(identifier, 1, 60000);

    if (!allowed) {
      return NextResponse.json(
        { error: "Demasiados intentos. Intenta de nuevo más tarde." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": "1",
            "X-RateLimit-Remaining": String(remaining),
            "X-RateLimit-Reset": String(Math.floor(resetTime / 1000)),
          },
        }
      );
    }
  } else if (request.nextUrl.pathname === "/api/emby-proxy") {
    // Proxy de metadata: 30 requests por minuto
    const { allowed, remaining, resetTime } = rateLimit(
      `emby-proxy:${identifier}`,
      30,
      60000
    );

    if (!allowed) {
      return NextResponse.json(
        { error: "Demasiadas peticiones. Intenta de nuevo más tarde." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": "30",
            "X-RateLimit-Remaining": String(remaining),
            "X-RateLimit-Reset": String(Math.floor(resetTime / 1000)),
          },
        }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
