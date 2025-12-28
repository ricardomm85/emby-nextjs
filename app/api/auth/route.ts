import { NextRequest, NextResponse } from "next/server";
import { validateEmbyHost, sanitizeDeviceId } from "@/lib/security";
import { rateLimit, getRequestIdentifier } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  // Rate limiting: 1 intento de login por minuto por IP
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

  try {
    const { host, username, password, deviceId } = await request.json();

    // Validar inputs
    if (!host || !username || !password) {
      return NextResponse.json(
        { error: "Faltan parámetros requeridos" },
        { status: 400 }
      );
    }

    // Validar host para prevenir SSRF
    const hostValidation = validateEmbyHost(host);
    if (!hostValidation.valid) {
      return NextResponse.json(
        { error: hostValidation.error || "Host inválido" },
        { status: 400 }
      );
    }

    // Sanitizar deviceId para prevenir header injection
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
      // Timeout de 10 segundos para prevenir hanging requests
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      // No exponer detalles internos del servidor
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
    // No exponer detalles del error
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
