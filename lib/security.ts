/**
 * Validación y sanitización de seguridad
 */

// Lista blanca de protocolos permitidos
const ALLOWED_PROTOCOLS = ["http:", "https:"];

// Rangos de IPs privadas que no deberían ser accesibles
const PRIVATE_IP_RANGES = [
  /^127\./, // localhost
  /^10\./, // private network
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // private network
  /^192\.168\./, // private network
  /^169\.254\./, // link-local
  /^::1$/, // localhost IPv6
  /^fc00:/, // private IPv6
  /^fe80:/, // link-local IPv6
];

/**
 * Valida que un host de Emby sea seguro
 * - Solo permite http/https
 * - Bloquea IPs privadas para prevenir SSRF
 * - Valida formato de URL
 */
export function validateEmbyHost(host: string): { valid: boolean; error?: string } {
  if (!host || typeof host !== "string") {
    return { valid: false, error: "Host inválido" };
  }

  // Validar longitud razonable
  if (host.length > 500) {
    return { valid: false, error: "Host demasiado largo" };
  }

  try {
    const url = new URL(host);

    // Validar protocolo
    if (!ALLOWED_PROTOCOLS.includes(url.protocol)) {
      return { valid: false, error: "Protocolo no permitido. Use http o https" };
    }

    // Validar que tenga hostname
    if (!url.hostname) {
      return { valid: false, error: "Hostname inválido" };
    }

    // Bloquear IPs privadas/localhost para prevenir SSRF
    const hostname = url.hostname.toLowerCase();
    for (const range of PRIVATE_IP_RANGES) {
      if (range.test(hostname)) {
        return { valid: false, error: "No se permiten IPs privadas o localhost" };
      }
    }

    // Bloquear localhost por nombre
    if (hostname === "localhost" || hostname.endsWith(".localhost")) {
      return { valid: false, error: "No se permite localhost" };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: "URL mal formada" };
  }
}

/**
 * Sanitiza un deviceId para prevenir header injection
 * - Elimina caracteres de control y saltos de línea
 * - Limita longitud
 */
export function sanitizeDeviceId(deviceId: string): string {
  if (!deviceId || typeof deviceId !== "string") {
    return "unknown";
  }

  // Eliminar caracteres de control, saltos de línea, etc.
  let sanitized = deviceId.replace(/[\r\n\t\x00-\x1F\x7F]/g, "");

  // Limitar longitud
  sanitized = sanitized.substring(0, 100);

  // Solo permitir caracteres alfanuméricos, guiones y guiones bajos
  sanitized = sanitized.replace(/[^a-zA-Z0-9\-_]/g, "");

  return sanitized || "unknown";
}

/**
 * Sanitiza un filename para prevenir header injection
 * - Elimina caracteres de control y saltos de línea
 * - Limita a nombre de archivo seguro
 */
export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== "string") {
    return "download";
  }

  // Eliminar caracteres de control, saltos de línea
  let sanitized = filename.replace(/[\r\n\t\x00-\x1F\x7F]/g, "");

  // Eliminar caracteres peligrosos para paths
  sanitized = sanitized.replace(/[\/\\:*?"<>|]/g, "");

  // Limitar longitud
  sanitized = sanitized.substring(0, 255);

  return sanitized || "download";
}

/**
 * Valida que una URL de descarga pertenezca al host de Emby autorizado
 */
export function validateDownloadUrl(
  downloadUrl: string,
  authorizedHost: string
): { valid: boolean; error?: string } {
  if (!downloadUrl || typeof downloadUrl !== "string") {
    return { valid: false, error: "URL inválida" };
  }

  if (!authorizedHost || typeof authorizedHost !== "string") {
    return { valid: false, error: "Host autorizado inválido" };
  }

  try {
    const urlObj = new URL(downloadUrl);
    const hostObj = new URL(authorizedHost);

    // Verificar que el hostname y puerto coincidan
    if (urlObj.hostname !== hostObj.hostname || urlObj.port !== hostObj.port) {
      return { valid: false, error: "URL no autorizada - debe ser del servidor Emby configurado" };
    }

    // Verificar protocolo
    if (!ALLOWED_PROTOCOLS.includes(urlObj.protocol)) {
      return { valid: false, error: "Protocolo no permitido" };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: "URL mal formada" };
  }
}
