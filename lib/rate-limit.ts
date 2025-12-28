/**
 * Simple rate limiter en memoria
 * Nota: En producción con múltiples instancias, usar una solución distribuida como Vercel KV
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Limpiar entradas antiguas cada 10 minutos
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 10 * 60 * 1000);

/**
 * Rate limiter simple basado en IP
 * @param identifier - Identificador único (típicamente IP)
 * @param maxRequests - Número máximo de peticiones
 * @param windowMs - Ventana de tiempo en milisegundos
 * @returns {allowed: boolean, remaining: number, resetTime: number}
 */
export function rateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60000 // 1 minuto por defecto
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);

  if (!entry || now > entry.resetTime) {
    // Primera petición o ventana expirada
    const resetTime = now + windowMs;
    rateLimitMap.set(identifier, { count: 1, resetTime });
    return { allowed: true, remaining: maxRequests - 1, resetTime };
  }

  if (entry.count >= maxRequests) {
    // Límite excedido
    return { allowed: false, remaining: 0, resetTime: entry.resetTime };
  }

  // Incrementar contador
  entry.count++;
  rateLimitMap.set(identifier, entry);
  return { allowed: true, remaining: maxRequests - entry.count, resetTime: entry.resetTime };
}

/**
 * Obtiene un identificador del request (IP o fallback)
 */
export function getRequestIdentifier(request: Request): string {
  // Intentar obtener IP real del request
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  // Fallback: usar User-Agent + un hash simple
  const userAgent = request.headers.get("user-agent") || "unknown";
  return `fallback-${userAgent.substring(0, 50)}`;
}
