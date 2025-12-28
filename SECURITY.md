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

**Implementation:** `lib/security.ts` - `validateEmbyHost()`

**Note:** Download proxy was removed entirely. Downloads now happen directly from browser to Emby server (see Bandwidth Protection below).

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
- **Emby proxy** (`/api/emby-proxy`): 30 requests per minute per IP
- Returns HTTP 429 with retry-after headers
- Implemented via middleware for better consistency

**Implementation:**
- `lib/rate-limit.ts` - Rate limiting logic
- `middleware.ts` - Applied at edge before API routes

**Limitations:**
- In-memory implementation only protects within a single serverless instance
- Vercel serverless functions are stateless and ephemeral
- For distributed rate limiting, use Vercel KV, Upstash Redis, or similar
- Current implementation provides basic protection but can be bypassed with distributed attacks

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

## Bandwidth Protection (Vercel Free Tier)

### The Problem

Vercel Free tier includes:
- 100 GB bandwidth per month
- Serverless function execution time limits
- Function payload size limits

A previous implementation used `/api/download` as a proxy for downloads, which would:
- Stream entire video files (2-50 GB each) through Vercel
- Consume massive bandwidth
- Be vulnerable to quota exhaustion attacks
- Not work reliably due to serverless limits

### The Solution

**Hybrid approach: Proxy metadata, direct downloads**

1. **Metadata operations use proxy** (`/api/emby-proxy`):
   - Searches (~10-50 KB each)
   - Item details (~5-10 KB each)
   - Episode lists (~5-50 KB each)
   - Total: ~100 KB per user session
   - ✅ Solves mixed content issues
   - ✅ Minimal bandwidth impact

2. **Downloads happen DIRECTLY** from browser to Emby:
   - Movies: 2-5 GB each
   - Series: 10-50 GB
   - ✅ Zero Vercel bandwidth for downloads
   - ✅ No quota exhaustion risk

**Protection mechanisms:**
- `/api/emby-proxy` blocks video stream endpoints
- Rate limiting: 30 metadata requests/min per IP
- Timeout: 10 seconds for metadata requests

**Code Changes:**
- Added `/app/api/emby-proxy/route.ts` for metadata
- Updated `lib/emby-api.ts` to use proxy for metadata
- Downloads remain direct (via `getDownloadUrl()`)

**Bandwidth impact:**
- Metadata: ~1-5 GB/month (thousands of users)
- Downloads: 0 GB (direct to Emby)
- Total Vercel usage: Well within 100 GB free tier

This architectural decision prioritizes:
- ✅ Protection of free tier quota
- ✅ No mixed content warnings for browsing
- ✅ Fast downloads (no proxy)
- ✅ Secure metadata access

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
