import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { host, username, password, deviceId } = await request.json();

    console.log("[API AUTH] Proxy request to:", host);
    console.log("[API AUTH] Username:", username);

    const url = `${host}/emby/Users/AuthenticateByName`;

    const authHeader = `MediaBrowser Client="EmbyNextJS", Device="Browser", DeviceId="${deviceId}", Version="1.0"`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Emby-Authorization": authHeader,
      },
      body: JSON.stringify({
        Username: username,
        Pw: password,
        Password: password,
      }),
    });

    console.log("[API AUTH] Emby response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[API AUTH] Emby error:", errorText);
      return NextResponse.json(
        { error: `Error ${response.status}: ${errorText || response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("[API AUTH] Success for user:", data.User.Name);

    return NextResponse.json({
      token: data.AccessToken,
      userId: data.User.Id,
      userName: data.User.Name,
    });
  } catch (error) {
    console.error("[API AUTH] Exception:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
