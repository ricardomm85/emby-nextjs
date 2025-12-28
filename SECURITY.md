# Security Measures

This document outlines the security measures implemented in this application.

## Vulnerabilities Fixed

### 1. SSRF (Server-Side Request Forgery) Prevention

**Problem:** API endpoints accepted arbitrary URLs from clients, allowing attackers to:
- Scan internal network ports
- Access cloud metadata endpoints (AWS, GCP, Azure)
- Bypass firewalls to access internal services

**Solution:**
- **`/api/auth`**: Validates Emby host URLs, blocking:
  - Private IP ranges (10.x.x.x, 192.168.x.x, 172.16-31.x.x)
  - Localhost and link-local addresses
  - Non-HTTP/HTTPS protocols
- **`/api/download`**: Validates download URLs match the authorized Emby server
  - Compares hostname and port with authenticated server
  - Prevents downloading from arbitrary URLs

**Implementation:** `lib/security.ts` - `validateEmbyHost()` and `validateDownloadUrl()`

### 2. Header Injection Prevention

**Problem:** User-controlled values inserted directly into HTTP headers could inject malicious headers via CRLF (`\r\n`) injection.

**Solution:**
- **DeviceId**: Sanitized to remove control characters, newlines, and special characters
  - Only allows alphanumeric, hyphens, and underscores
  - Limited to 100 characters
- **Filename**: Sanitized for Content-Disposition header
  - Removes control characters and path separators
  - Uses RFC 5987 syntax for safe UTF-8 filenames
  - Limited to 255 characters

**Implementation:** `lib/security.ts` - `sanitizeDeviceId()` and `sanitizeFilename()`

### 3. Rate Limiting

**Problem:** No protection against brute force attacks or API abuse.

**Solution:**
- **Login endpoint** (`/api/auth`): 1 attempt per minute per IP
- **Download endpoint** (`/api/download`): 5 downloads per minute per IP
- Returns HTTP 429 with retry-after headers
- In-memory implementation (suitable for single instance)
  - For production with multiple instances, use distributed storage (Redis, Vercel KV)

**Implementation:** `lib/rate-limit.ts`

### 4. Timeout Protection

**Problem:** Hanging requests to external servers could exhaust resources.

**Solution:**
- Auth requests: 10 second timeout
- Download requests: 60 second timeout
- Uses `AbortSignal.timeout()` for automatic cleanup

### 5. Information Disclosure Prevention

**Problem:** Detailed error messages exposed internal server information.

**Solution:**
- Generic error messages for external consumption
- No exposure of internal server responses or stack traces
- Proper HTTP status codes without revealing implementation details

### 6. Content Security Policy (CSP)

**Problem:** XSS attacks could inject malicious scripts, clickjacking, and other injection attacks.

**Solution:**
Comprehensive security headers implemented in `next.config.ts`:

- **CSP Headers**:
  - `default-src 'self'` - Only load resources from same origin by default
  - `script-src 'self' 'unsafe-inline' 'unsafe-eval'` - Required for Next.js hydration
  - `style-src 'self' 'unsafe-inline'` - Required for Tailwind CSS
  - `img-src 'self' data: https: http:` - Allow images from Emby servers
  - `connect-src 'self' https: http:` - Allow API calls to Emby servers
  - `frame-src 'none'` - No iframes allowed
  - `object-src 'none'` - No plugins/objects
  - `base-uri 'self'` - Prevent base tag injection
  - `form-action 'self'` - Forms only submit to same origin

- **X-Frame-Options: DENY** - Prevent clickjacking
- **X-Content-Type-Options: nosniff** - Prevent MIME sniffing
- **Referrer-Policy: strict-origin-when-cross-origin** - Control referrer information
- **Permissions-Policy** - Disable camera, microphone, geolocation

**Notes:**
- `unsafe-inline` and `unsafe-eval` are necessary for Next.js functionality. In a future version, consider using nonces for stricter CSP.
- `upgrade-insecure-requests` is NOT used because the app needs to connect to HTTP Emby servers (typically on local networks without SSL).

## Security Best Practices

### Current Implementation

✅ Input validation on all API endpoints
✅ Output sanitization for headers
✅ SSRF prevention with URL validation
✅ Rate limiting on sensitive endpoints
✅ Request timeouts
✅ No sensitive data in error messages
✅ HTTPS-only in production (Vercel default)
✅ XSS protection (Next.js default escaping)
✅ CSP (Content Security Policy) headers
✅ X-Frame-Options: DENY (clickjacking protection)
✅ X-Content-Type-Options: nosniff
✅ Referrer-Policy: strict-origin-when-cross-origin
✅ Permissions-Policy (disable camera, microphone, geolocation)

### Recommendations for Production

⚠️ **Rate Limiting**: Current implementation uses in-memory storage. For multi-instance deployments:
- Use Redis or Vercel KV for distributed rate limiting
- Consider Vercel's built-in rate limiting features

⚠️ **Emby Host Whitelist**: Consider adding an environment variable for allowed Emby hosts:
```env
ALLOWED_EMBY_HOSTS=emby1.example.com,emby2.example.com
```


⚠️ **Authentication Token Security**:
- Tokens stored in localStorage (XSS vulnerable)
- Consider using httpOnly cookies for sensitive tokens
- Current implementation acceptable for this use case

⚠️ **CORS Configuration**: Review CORS settings if exposing API to external clients

⚠️ **Logging & Monitoring**:
- Log failed authentication attempts
- Monitor rate limit violations
- Alert on suspicious patterns

## Testing Security

To test the security measures:

```bash
# Test SSRF protection (should fail)
curl -X POST http://localhost:3000/api/auth \
  -H "Content-Type: application/json" \
  -d '{"host":"http://localhost:6379","username":"test","password":"test"}'

# Test rate limiting (run 6 times quickly)
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/auth \
    -H "Content-Type: application/json" \
    -d '{"host":"http://emby.example.com","username":"test","password":"test"}'
done

# Test header injection (should be sanitized)
curl -X POST http://localhost:3000/api/auth \
  -H "Content-Type: application/json" \
  -d '{"host":"http://emby.example.com","username":"test","password":"test","deviceId":"malicious\r\nX-Evil: header"}'
```

## Reporting Security Issues

If you discover a security vulnerability, please email the maintainer directly instead of opening a public issue.
