import { NextRequest, NextResponse } from "next/server";

/**
 * Generic proxy for GET requests to Emby
 * For metadata (searches, details, episodes) and images
 * NOT for video downloads (to protect bandwidth)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "URL parameter required" }, { status: 400 });
  }

  try {
    // Validate URL is valid
    const urlObj = new URL(url);

    // Validate protocol
    if (!["http:", "https:"].includes(urlObj.protocol)) {
      return NextResponse.json({ error: "Invalid protocol" }, { status: 400 });
    }

    // Block download/stream endpoints to prevent bandwidth abuse
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
      // 10 second timeout
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Emby server error: ${response.status}` },
        { status: response.status }
      );
    }

    const contentType = response.headers.get("content-type");

    // If it's an image, return binary content
    if (contentType && contentType.startsWith("image/")) {
      const imageBuffer = await response.arrayBuffer();

      return new NextResponse(imageBuffer, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }

    // If it's JSON (metadata), return as JSON
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
