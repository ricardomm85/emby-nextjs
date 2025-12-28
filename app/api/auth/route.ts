import { NextRequest, NextResponse } from "next/server";
import { validateEmbyHost, sanitizeDeviceId } from "@/lib/security";

export async function POST(request: NextRequest) {
  // Note: Rate limiting is handled in proxy.ts
  try {
    const { host, username, password, deviceId } = await request.json();

    // Validate inputs
    if (!host || !username || !password) {
      return NextResponse.json(
        { error: "Faltan parámetros requeridos" },
        { status: 400 }
      );
    }

    // Validate host to prevent SSRF
    const hostValidation = validateEmbyHost(host);
    if (!hostValidation.valid) {
      return NextResponse.json(
        { error: hostValidation.error || "Host inválido" },
        { status: 400 }
      );
    }

    // Sanitize deviceId to prevent header injection
    const safeDeviceId = sanitizeDeviceId(deviceId);

    const url = `${host}/emby/Users/AuthenticateByName`;

    const authHeader = `MediaBrowser Client="EmbyNextJS", Device="Browser", DeviceId="${safeDeviceId}", Version="1.0"`;

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
      // 10 second timeout to prevent hanging requests
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      // Don't expose internal server details
      return NextResponse.json(
        { error: "Credenciales inválidas o servidor no disponible" },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      token: data.AccessToken,
      userId: data.User.Id,
      userName: data.User.Name,
    });
  } catch (error) {
    // Don't expose error details
    if (error instanceof Error && error.name === "TimeoutError") {
      return NextResponse.json(
        { error: "Timeout al conectar con el servidor" },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
}
