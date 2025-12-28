import { NextRequest } from "next/server";
import { sanitizeFilename } from "@/lib/security";
import { rateLimit, getRequestIdentifier } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  // Rate limiting: 5 descargas por minuto por IP
  const identifier = getRequestIdentifier(request);
  const { allowed, remaining, resetTime } = rateLimit(identifier, 5, 60000);

  if (!allowed) {
    return new Response("Demasiadas descargas. Intenta de nuevo más tarde.", {
      status: 429,
      headers: {
        "X-RateLimit-Limit": "5",
        "X-RateLimit-Remaining": String(remaining),
        "X-RateLimit-Reset": String(Math.floor(resetTime / 1000)),
      },
    });
  }

  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get("url");
  const filename = searchParams.get("filename");
  const host = searchParams.get("host"); // Host de Emby autorizado

  if (!url || !filename || !host) {
    return new Response("Missing required parameters", { status: 400 });
  }

  try {
    // Validar que la URL de descarga pertenezca al host de Emby
    const urlObj = new URL(url);
    const hostObj = new URL(host);

    // Verificar que el hostname y puerto coincidan
    if (urlObj.hostname !== hostObj.hostname || urlObj.port !== hostObj.port) {
      return new Response("Unauthorized: URL must be from configured Emby server", {
        status: 403,
      });
    }

    // Validar protocolo
    if (!["http:", "https:"].includes(urlObj.protocol)) {
      return new Response("Invalid protocol", { status: 400 });
    }

    // Sanitizar filename para prevenir header injection
    const safeFilename = sanitizeFilename(filename);

    const response = await fetch(url, {
      headers: {
        "User-Agent": "EmbyNextJS/1.0",
      },
      // Timeout de 60 segundos
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      return new Response("Failed to fetch video", { status: response.status });
    }

    const headers = new Headers();
    // Usar sintaxis RFC 5987 para nombres de archivo seguros
    headers.set(
      "Content-Disposition",
      `attachment; filename="${safeFilename}"; filename*=UTF-8''${encodeURIComponent(safeFilename)}`
    );
    headers.set("Content-Type", response.headers.get("Content-Type") || "video/mp4");

    const contentLength = response.headers.get("Content-Length");
    if (contentLength) {
      headers.set("Content-Length", contentLength);
    }

    return new Response(response.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      return new Response("Download timeout", { status: 504 });
    }
    return new Response("Error fetching video", { status: 500 });
  }
}
