import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy genérico para peticiones GET a Emby
 * Solo para metadata (búsquedas, detalles, episodios)
 * NO para descargas de video (para proteger bandwidth)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "URL parameter required" }, { status: 400 });
  }

  try {
    // Validar que la URL sea válida
    const urlObj = new URL(url);

    // Validar protocolo
    if (!["http:", "https:"].includes(urlObj.protocol)) {
      return NextResponse.json({ error: "Invalid protocol" }, { status: 400 });
    }

    // Bloquear endpoints de descarga/stream para prevenir abuso de bandwidth
    if (
      url.includes("/Videos/") &&
      (url.includes("/stream") || url.includes("/download"))
    ) {
      return NextResponse.json(
        { error: "Video streaming not allowed through proxy" },
        { status: 403 }
      );
    }

    const response = await fetch(url, {
      headers: {
        "User-Agent": "EmbyNextJS/1.0",
      },
      // Timeout de 10 segundos
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Emby server error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      return NextResponse.json({ error: "Request timeout" }, { status: 504 });
    }
    return NextResponse.json(
      { error: "Failed to fetch from Emby server" },
      { status: 500 }
    );
  }
}
