# Rev Winner - AI Sales Intelligence Platform

## Overview

Rev Winner is a production SaaS platform that provides real-time AI-powered sales coaching during live calls. It captures live audio, transcribes conversations in real-time, and delivers contextual sales intelligence including discovery questions, objection handling, competitor analysis, battle cards, pitch decks, case studies, and meeting minutes. The platform serves individual sales reps and enterprise teams with a multi-tier subscription and licensing model.

The platform is built by Healthcaa Technologies (India) and serves a global user base with support for USD and INR billing.

## User Preferences

Preferred communication style: Simple, everyday language.

**Critical rules when making changes:**
- Do NOT break, remove, modify, or regress any existing functionality, APIs, UI, billing logic, authentication, or user flows
- Do NOT create new pages or routes unless explicitly requested
- All enhancements should be additive — treat changes as extensions, not replacements
- Preserve backward compatibility at all times
- Test that core flows (auth, live calls, billing, admin panel) still work after any change
- When modifying AI response modules (Shift Gears, Customer Query Pitches, Conversation Analysis), do not touch other modules
- Performance matters — response latency during live calls must remain fast

## System Architecture

### Tech Stack
- **Frontend:** React + TypeScript + Vite, TanStack Query v5 for data fetching, Tailwind CSS + shadcn/ui (Radix UI components), Framer Motion for animations
- **Backend:** Node.js + Express + TypeScript, WebSockets for real-time communication
- **Database:** PostgreSQL on Neon (serverless), Drizzle ORM for schema and queries
- **Build:** Vite for frontend, esbuild for server bundling, tsx for development
- **Auth:** Custom JWT-based authentication (access + refresh tokens), bcrypt for password hashing, with Replit Auth as an alternative OIDC integration
- **Sessions:** PostgreSQL-backed sessions via connect-pg-simple

### Directory Structure
- `client/` — React frontend (SPA with Vite)
- `server/` — Express backend (API routes, services, middleware, WebSocket handlers)
- `shared/` — Shared schema definitions (Drizzle ORM schema used by both client and server)
- `drizzle/` — Database migration output
- `attached_assets/` — Requirement documents, logos, and design specs
- `docs/` and `documentation/` — Technical documentation
- `scripts/` — Maintenance and utility scripts (plan management, data fixes, testing)

### Key Backend Patterns
- **Route organization:** Routes split across multiple files (`routes-auth.ts`, `routes-admin.ts`, `routes-admin-plans.ts`, `routes-api-keys.ts`, `routes-api-docs.ts`, etc.) registered via a central `registerRoutes` function
- **Storage layer:** Abstracted storage modules (`storage.ts`, `storage-auth.ts`, `storage-billing.ts`) wrapping Drizzle ORM queries
- **Middleware:** Custom auth middleware (`authenticateToken`, `requireAdmin`), performance monitoring
- **Services:** Dedicated service modules for email, event logging, job queues
- **Error handling:** Global process-level error handlers for unhandled rejections and uncaught exceptions

### Database Schema
The schema is defined in `shared/schema.ts` and managed via Drizzle ORM with PostgreSQL on Neon. Key tables include:
- `auth_users` — User accounts with roles (user, admin, license_manager)
- `sessions` — Express session store
- `addon_purchases` — Subscription add-ons (platform_access, session_minutes, train_me, dai)
- `subscription_plans` / `addons` — Plan and add-on definitions
- `pending_orders` — Order tracking and invoice generation
- `session_usage` — Call session tracking with pause/resume support
- `audit_logs` — Admin audit trail
- `traffic_logs` — Website traffic and geolocation tracking
- `api_keys` / `api_key_usage_logs` — API key management and usage tracking
- `system_config` — Dynamic system configuration (branding, terms, etc.)

Use `npm run db:push` to push schema changes to the database.

### Frontend Architecture
- Single-page application with React Router
- Path aliases: `@/*` → `client/src/*`, `@shared/*` → `shared/*`, `@assets` → `attached_assets/`
- shadcn/ui component library built on Radix UI primitives
- TanStack Query for server state management
- WebSocket connection for real-time transcript streaming and AI coaching during live calls

### Real-Time Pipeline
- Single WebSocket connection handles multiple event types: audio/STT, coaching suggestions, analysis results
- Deepgram SDK for live speech-to-text transcription
- Multiple AI model support: OpenAI, Anthropic Claude, Google Gemini, DeepSeek, Grok
- AI processing modules: Shift Gears, Customer Query Pitches, Conversation Analysis, Present to Win (Battle Cards, Case Studies, Pitch Decks), Meeting Minutes

### Subscription & Billing Model
- Individual and Enterprise subscription tiers
- Add-on system: Platform Access, Session Minutes, Train Me (document upload for domain training), DAI
- License Manager role for enterprise seat management
- Invoice generation from `pending_orders` + `auth_users` data (no separate invoices table)

## External Dependencies

### Payment Gateways
- **Razorpay** — Primary payment processor, supports TEST and LIVE modes via `RAZORPAY_MODE` env var. Handles orders, refunds, webhooks, and subscriptions. Supports INR and USD.
- **Cashfree** — Secondary payment integration via `@cashfreepayments/cashfree-js`

### AI / LLM Services
- **OpenAI** — GPT models for conversation analysis and sales intelligence
- **Anthropic Claude** (`@anthropic-ai/sdk`) — Alternative AI model
- **Google Gemini** (`@google/generative-ai`) — Alternative AI model
- **DeepSeek / Grok** — Additional model options

### Speech & Audio
- **Deepgram** (`@deepgram/sdk`) — Real-time speech-to-text transcription with speaker diarization

### Cloud & Storage
- **Neon PostgreSQL** (`@neondatabase/serverless`) — Serverless Postgres database
- **Google Cloud Storage** (`@google-cloud/storage`) — Object storage for files, with Replit sidecar integration

### Communication
- **Microsoft Teams** (`@microsoft/teams-js`, `@microsoft/microsoft-graph-client`, `@azure/msal-node`) — Teams integration for meeting connectivity
- **Email service** — Custom email module for OTP, welcome emails, password reset, admin notifications

### Infrastructure
- **Replit** — Hosting platform with auth integration, object storage, dev tooling plugins
- **Express sessions** stored in PostgreSQL via `connect-pg-simple`
- **Zod** — Runtime validation for API inputs and schema definitions
- **JWT** (`jsonwebtoken`) — Token-based authentication
- **bcrypt** — Password hashing

### Environment Variables Required
- `DATABASE_URL` — Neon PostgreSQL connection string
- `SESSION_SECRET` — Express session secret
- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` (plus TEST/LIVE variants)
- `RAZORPAY_MODE` — TEST or LIVE
- AI API keys (OpenAI, Anthropic, Google, etc.)
- `DEEPGRAM_API_KEY` — For speech-to-text
- `REPLIT_DOMAINS` / `REPL_ID` — Replit environment identifiers
- Microsoft Azure credentials for Teams integration