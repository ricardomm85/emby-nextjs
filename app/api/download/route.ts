import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get("url");
  const filename = searchParams.get("filename");

  if (!url || !filename) {
    return new Response("Missing url or filename", { status: 400 });
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "EmbyNextJS/1.0",
      },
    });

    if (!response.ok) {
      return new Response("Failed to fetch video", { status: response.status });
    }

    const headers = new Headers();
    headers.set("Content-Disposition", `attachment; filename="${filename}"`);
    headers.set("Content-Type", response.headers.get("Content-Type") || "video/mp4");

    const contentLength = response.headers.get("Content-Length");
    if (contentLength) {
      headers.set("Content-Length", contentLength);
    }

    return new Response(response.body, {
      status: 200,
      headers,
    });
  } catch {
    return new Response("Error fetching video", { status: 500 });
  }
}
