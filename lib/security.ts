/**
 * Security validation and sanitization
 */

// Whitelist of allowed protocols
const ALLOWED_PROTOCOLS = ["http:", "https:"];

// Private IP ranges that shouldn't be accessible
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
 * Validate that an Emby host is safe
 * - Only allows http/https
 * - Blocks private IPs to prevent SSRF
 * - Validates URL format
 */
export function validateEmbyHost(host: string): { valid: boolean; error?: string } {
  if (!host || typeof host !== "string") {
    return { valid: false, error: "Host inválido" };
  }

  // Validate reasonable length
  if (host.length > 500) {
    return { valid: false, error: "Host demasiado largo" };
  }

  try {
    const url = new URL(host);

    // Validate protocol
    if (!ALLOWED_PROTOCOLS.includes(url.protocol)) {
      return { valid: false, error: "Protocolo no permitido. Use http o https" };
    }

    // Validate has hostname
    if (!url.hostname) {
      return { valid: false, error: "Hostname inválido" };
    }

    // Block private IPs/localhost to prevent SSRF
    const hostname = url.hostname.toLowerCase();
    for (const range of PRIVATE_IP_RANGES) {
      if (range.test(hostname)) {
        return { valid: false, error: "No se permiten IPs privadas o localhost" };
      }
    }

    // Block localhost by name
    if (hostname === "localhost" || hostname.endsWith(".localhost")) {
      return { valid: false, error: "No se permite localhost" };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: "URL mal formada" };
  }
}

/**
 * Sanitize a deviceId to prevent header injection
 * - Remove control characters and line breaks
 * - Limit length
 */
export function sanitizeDeviceId(deviceId: string): string {
  if (!deviceId || typeof deviceId !== "string") {
    return "unknown";
  }

  // Remove control characters, line breaks, etc.
  let sanitized = deviceId.replace(/[\r\n\t\x00-\x1F\x7F]/g, "");

  // Limit length
  sanitized = sanitized.substring(0, 100);

  // Only allow alphanumeric characters, hyphens and underscores
  sanitized = sanitized.replace(/[^a-zA-Z0-9\-_]/g, "");

  return sanitized || "unknown";
}

/**
 * Sanitize a filename to prevent header injection
 * - Remove control characters and line breaks
 * - Limit to safe filename
 */
export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== "string") {
    return "download";
  }

  // Remove control characters, line breaks
  let sanitized = filename.replace(/[\r\n\t\x00-\x1F\x7F]/g, "");

  // Remove dangerous characters for paths
  sanitized = sanitized.replace(/[\/\\:*?"<>|]/g, "");

  // Limit length
  sanitized = sanitized.substring(0, 255);

  return sanitized || "download";
}

/**
 * Validate that a download URL belongs to the authorized Emby host
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

    // Verify hostname and port match
    if (urlObj.hostname !== hostObj.hostname || urlObj.port !== hostObj.port) {
      return { valid: false, error: "URL no autorizada - debe ser del servidor Emby configurado" };
    }

    // Verify protocol
    if (!ALLOWED_PROTOCOLS.includes(urlObj.protocol)) {
      return { valid: false, error: "Protocolo no permitido" };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: "URL mal formada" };
  }
}
