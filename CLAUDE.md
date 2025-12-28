# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Production build
npm run lint     # Run ESLint
npm start        # Start production server
```

## Architecture

This is an Emby media server client built with Next.js 15 (App Router), TailwindCSS 4, and shadcn/ui components. It allows users to search and download movies/series from an Emby server.

### Core Flow

1. **Authentication**: User logs in with Emby server credentials (`/login`)
2. **Search**: Browse and search for movies/series (`/search`)
3. **Download**: View details and download content (`/movie/[id]`, `/series/[id]`)

### Key Files

- `lib/emby-api.ts` - Emby API client (auth, search, episodes, download URLs)
- `lib/types.ts` - TypeScript types + utility functions (formatDuration, formatSize, groupEpisodesBySeason)
- `lib/security.ts` - Security utilities (SSRF prevention, input sanitization)
- `lib/rate-limit.ts` - In-memory rate limiting
- `components/auth-provider.tsx` - React Context for auth state, persists to localStorage
- `app/api/auth/route.ts` - Proxy API route for authentication (prevents CORS/mixed content)
- `middleware.ts` - Rate limiting middleware for API routes

### Authentication State

Credentials stored in localStorage:
- `emby_host` - Server URL
- `emby_token` - Access token from AuthenticateByName
- `emby_user_id` - User ID

### Emby API Endpoints Used

```
POST /emby/Users/AuthenticateByName     # Login (via /api/auth proxy)
GET  /emby/Users/{userId}/Items         # Search items (direct from browser)
GET  /emby/Users/{userId}/Items/{id}    # Item details (direct from browser)
GET  /emby/Shows/{seriesId}/Episodes    # Series episodes (direct from browser)
GET  /emby/Videos/{itemId}/stream       # Download stream (direct from browser)
```

**Important:** Only authentication uses the `/api/auth` proxy to avoid CORS and mixed content issues. All other requests (search, details, episodes, downloads) go directly from browser to Emby server to avoid consuming Vercel bandwidth quota.

### UI Components

Uses shadcn/ui components in `components/ui/`. Custom components:
- `media-card.tsx` - Card for movie/series in search results
- `auth-provider.tsx` - Auth context provider with useAuth hook
