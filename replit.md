# Rev Winner - AI Sales Intelligence Platform

## Overview

Rev Winner is a production SaaS platform built by Healthcaa Technologies that provides real-time AI-powered sales coaching during live calls. The platform listens to sales conversations, transcribes them in real-time using Deepgram, and provides contextual coaching, objection handling, battle cards, pitch decks, case studies, meeting minutes, and conversation analysis powered by multiple AI models (OpenAI, Anthropic Claude, Google Gemini).

The platform supports individual subscriptions and enterprise/team licensing with a License Manager role, an Admin Panel for platform management, a "Train Me" add-on for custom domain knowledge uploads, a Marketing add-on for content generation, and interactive sales challenge games for lead generation.

## User Preferences

Preferred communication style: Simple, everyday language.

**Critical rules when making changes:**
- Do NOT break, remove, modify, or regress any existing functionality, APIs, UI, billing logic, authentication, or user flows
- Do NOT create new pages or routes unless explicitly asked
- All enhancements should be additive — built on top of existing interfaces
- Preserve backward compatibility at all times
- Make small, incremental changes and verify core flows still work after each change
- Performance and response speed must not degrade

## System Architecture

### Frontend
- **Framework:** React with TypeScript, built with Vite
- **State Management:** TanStack Query v5 for server state (API caching, mutations)
- **UI Components:** Radix UI primitives with Tailwind CSS for styling (shadcn/ui pattern)
- **Styling:** Tailwind CSS with CSS custom properties for theming, PostCSS with autoprefixer
- **Forms:** React Hook Form with Zod resolvers for validation
- **Animations:** Framer Motion (should be limited during active calls for performance)
- **Path aliases:** `@/*` maps to `./client/src/*`, `@shared/*` maps to `./shared/*`, `@assets` maps to `./attached_assets`
- **Entry point:** `client/index.html`, source files in `client/src/`

### Backend
- **Runtime:** Node.js with Express, TypeScript compiled via tsx (dev) and esbuild (production)
- **Module system:** ESM (`"type": "module"` in package.json)
- **API structure:** RESTful routes split across multiple route files (`server/routes-*.ts`)
- **Real-time:** WebSockets for live transcription streaming and coaching events during calls
- **Authentication:** JWT-based (access + refresh tokens), with middleware in `server/middleware/auth.ts`. Supports roles: user, admin, super_admin, license_manager
- **Route organization:** Separate route files for auth, admin, enterprise, billing, backup, API keys, API docs, admin plans, etc.
- **Services layer:** Business logic in `server/services/` (email, event-logger, job-queue, meeting-minutes-backup, etc.)
- **Performance monitoring:** Custom middleware in `server/middleware/performance-logger.ts`

### Database
- **Database:** PostgreSQL hosted on Neon (serverless)
- **ORM:** Drizzle ORM with `@neondatabase/serverless` driver using WebSocket connections
- **Schema:** Defined in `shared/schema.ts` (shared between frontend and backend)
- **Migrations:** Managed via `drizzle-kit push` (schema push approach, migrations output to `./migrations/`)
- **Session storage:** PostgreSQL via `connect-pg-simple` (table: `sessions`)
- **Connection:** Pool-based via `@neondatabase/serverless` Pool with WebSocket constructor

### Key Database Tables (from schema patterns observed)
- `auth_users` - User accounts with roles, status, email verification
- `addon_purchases` - Subscription add-ons (platform_access, session_minutes, train_me, dai)
- `audit_logs` - Admin audit trail
- `traffic_logs` - Website traffic analytics with geolocation
- `api_keys` / `api_key_usage_logs` - API key management
- `sessions` - Express session storage
- Subscription plans, organizations, license packages, memberships, assignments for enterprise

### Performance Optimizations Already Applied
- Database queries parallelized with `Promise.all` instead of sequential queries
- Email sending made non-blocking (fire-and-forget pattern)
- Query caching with `staleTime` on frontend
- Request body size limit set to 50MB for PDF/image uploads
- Proxy trust enabled for accurate IP detection behind load balancers

### Build & Development
- **Dev:** `tsx server/index.ts` with Vite dev server (HMR)
- **Build:** `vite build` for frontend + `esbuild` bundle for server → outputs to `dist/`
- **Production:** `node dist/index.js` serves static files from `dist/public/`
- **Database migrations:** `npm run db:push` (drizzle-kit push)
- **Utility scripts:** Various `tsx scripts/*.ts` for data fixes, testing, auditing

### Object Storage
- Google Cloud Storage integration via `@google-cloud/storage` for file uploads
- ACL-based access control system (`server/objectAcl.ts`, `server/objectStorage.ts`)
- Uses Replit sidecar endpoint for credentials

## External Dependencies

### AI/ML Services
- **OpenAI** - GPT models for conversation analysis, coaching, content generation
- **Anthropic Claude** (`@anthropic-ai/sdk`) - Alternative AI model for analysis
- **Google Gemini** (`@google/generative-ai`) - Alternative AI model
- **Deepgram** (`@deepgram/sdk`) - Real-time speech-to-text transcription, metered billing at ~$0.16/min

### Payment Processing
- **Razorpay** - Primary payment gateway (supports TEST and LIVE modes via `RAZORPAY_MODE` env var)
- **Cashfree** (`@cashfreepayments/cashfree-js`) - Alternative payment processor
- Dual-mode configuration: test keys vs live keys controlled by environment variables

### Communication & Auth
- **Email** - SMTP-based (Gmail) for OTP, welcome emails, license assignments, password resets
- **Microsoft Azure** - Teams integration (`@microsoft/teams-js`, `@azure/msal-node`, `@microsoft/microsoft-graph-client`) for meeting connectivity
- **Replit Auth** - OpenID Connect integration via `openid-client` and Passport.js (secondary auth)

### Storage & Infrastructure
- **Neon PostgreSQL** (`@neondatabase/serverless`) - Serverless Postgres with WebSocket connections
- **Google Cloud Storage** - File/object storage for uploads (Train Me documents, backups)
- **Replit** - Hosting platform with sidecar services for object storage credentials

### Key Environment Variables Required
- `DATABASE_URL` - Neon PostgreSQL connection string
- `SESSION_SECRET` - Express session secret
- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` (test and live variants)
- `RAZORPAY_MODE` - Controls test vs live payment processing
- `REPLIT_DOMAINS` / `REPL_ID` - Replit platform variables
- `ISSUER_URL` - OIDC issuer for Replit Auth
- AI API keys for OpenAI, Anthropic, Google Gemini
- Deepgram API key for transcription
- SMTP credentials for email
- Google Cloud Storage credentials