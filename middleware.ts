import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { rateLimit, getRequestIdentifier } from "@/lib/rate-limit";

export function middleware(request: NextRequest) {
  // Rate limiting solo en endpoints API sensibles
  if (request.nextUrl.pathname === "/api/auth") {
    const identifier = getRequestIdentifier(request);
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
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
