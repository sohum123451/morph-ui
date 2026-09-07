# PROJECT MEMORY & AI CONTEXT HANDOFF - MorphUI

> **Last Updated:** September 7, 2026
> **Repository:** https://github.com/sohum123451/morph-ui
> **Live Production:** https://morph-ui-pi.vercel.app
> **Vercel Project:** `trps-urgewave/morph-ui`
> **Local Git Repo Path:** `c:\Users\manga\hackathons\morph-ui`
> **IDE Workspace Path:** `c:\Users\manga\.gemini\antigravity-ide\brain\b7ae7b13-b9a4-4a12-ba4e-c6b5359caae8\idk`

---

## 1. Executive Summary & Purpose

MorphUI is a **real-time generative multi-entity comparison workbench**.
Traditional chatbots (ChatGPT, Claude, Gemini) answer comparison queries with dense, unstructured walls of text that cause cognitive fatigue.
**MorphUI replaces text walls with an interactive dual-engine viewport:**
1. **Interactive Spec Sheet View**: High-contrast, side-by-side metric tables, verified benchmark badges, consensus summaries, and community sentiment (Reddit/web consensus).
2. **Spatial Graph Canvas View**: Dynamic node-and-edge spatial graph powered by `@xyflow/react` showing trade-offs, strengths, and relationships in 2D space (press shortcut `V` to toggle).

---

## 2. Core Tech Stack

- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript
- **Styling**: Tailwind CSS + Custom CSS Theme Tokens (`canvas`, `surface`, `heading`, `muted`, `accent`)
- **Spatial Graph Engine**: `@xyflow/react` (React Flow)
- **AI Models & Orchestration**:
  - Primary: **Groq (`llama-3.3-70b-versatile`)** - sub-second structured JSON synthesis
  - Secondary: **Google Gemini 2.5 Flash (`@google/genai`)** - deep domain and reasoning fallback
  - Tertiary: **Parametric Domain Baseline Generator** - guarantees 0-crash resilience if external APIs are down
- **Live Grounding**: **SerpApi** (with DuckDuckGo/parametric fallback)
- **Caching**: Custom Stale-While-Revalidate (SWR) in-memory cache with stampede/jitter protection
- **Database & Security**: **Turso LibSQL** (`@libsql/client`) with **AES-256-GCM** encryption (`crypto.ts`)
- **Icons & Motion**: Lucide React + Framer Motion (where active)
- **Deployment**: Vercel Serverless (Production alias: `morph-ui-pi.vercel.app`)

---

## 3. Directory Layout & Key Files

```
morph-ui/
|-- app/
|   |-- page.tsx                      # Main client UI dashboard and state machine
|   |-- layout.tsx                    # Root layout with theme provider and metadata
|   |-- globals.css                   # Global styles and theme color definitions
|   `-- api/
|       |-- compare/
|       |   |-- route.ts              # Core comparison API (SerpApi fetch + LLM cascade)
|       |   |-- custom-metric/route.ts# Dynamic calculation of arbitrary new metrics
|       |   `-- image/route.ts        # Multimodal image analysis endpoint
|       |-- chats/                    # Chat session storage endpoints
|       |-- history/                  # User query history endpoints
|       `-- sessions/                 # Active session persistence
|-- components/
|   |-- widgets/
|   |   |-- ComparisonTableWidget.tsx # Interactive comparison table component
|   |   |-- AdmissionPredictorWidget.tsx
|   |   |-- BudgetTrackerWidget.tsx
|   |   `-- TimelineCalendarWidget.tsx
|   `-- ClientOnly.tsx                # Hydration protection wrapper
|-- lib/
|   |-- llmMiddleware.ts              # Multi-tier LLM cascade (Groq -> Gemini -> Parametric)
|   |-- factRetrieval.ts              # SerpApi and web grounding pipeline
|   |-- entitySplitter.ts             # Smart regex parsing for 'X vs Y vs Z' queries
|   |-- swrCache.ts                   # Stale-while-revalidate cache implementation
|   |-- crypto.ts                     # AES-256-GCM stealth encryption for user data
|   |-- db.ts                         # Turso LibSQL client with in-memory fallback
|   `-- security.ts                   # Sanitization and rate-limiting helpers
|-- types/
|   `-- morphui.ts                    # Core TypeScript interfaces (ComparisonData, EntityVerdict, etc.)
|-- .env.example                      # Template for required environment variables
`-- README.md                         # Architecture overview and documentation
```

---

## 4. End-to-End Data Flow

1. **Input Stage**:
   - User enters query via search box, voice input (Web Speech API), or file upload (image/screenshot).
   - Multi-entity queries (`"iPhone 16 vs Galaxy S25 vs Pixel 9"` or `"React vs Vue"`) are parsed into entity arrays via `lib/entitySplitter.ts`.
2. **SWR Cache Check** (`lib/swrCache.ts`):
   - Cache Hit (<20h): Returns instant JSON (0ms latency).
   - Cache Stale (20-24h): Returns cached data immediately + triggers background detached revalidation.
   - Cache Miss: Continues to retrieval pipeline.
3. **Fact Retrieval & Grounding** (`lib/factRetrieval.ts`):
   - Fetches live web snippets using SerpApi (`SERPAPI_API_KEY`).
   - If unavailable, falls back gracefully without halting.
4. **LLM Orchestration Cascade** (`lib/llmMiddleware.ts`):
   - Tier 1: Groq `llama-3.3-70b-versatile` with low temperature and strict JSON schema prompt.
   - Tier 2: Gemini 2.5 Flash (`@google/genai`) if Groq times out or fails.
   - Tier 3: Unconstrained secondary dynamic prompt.
   - Tier 4: Contextual parametric domain synthesis.
5. **Anti-Slop & Sanitization Guard**:
   - Strips generic AI placeholders (e.g. "Specialized architecture optimized for direct efficiency") and enforces concrete domain-specific metrics.
6. **Encrypted Persistence** (`lib/crypto.ts` & `lib/db.ts`):
   - Session data is encrypted using `AES-256-GCM` before being written to Turso DB.

---

## 5. Critical Invariants & Rules (For Future AI Agents)

1. **NO AI Slop / Generic Templates**:
   - Under no circumstances should the backend return static robotic phrases like *"High-reliability core performance"* or *"Practical use-case performance"*. Comparisons must be factually tailored to the entity category (food, hardware, cloud, shoes, etc.).
2. **Dual-View State Integrity**:
   - The toggle between Spec Sheet and Spatial Graph View must remain instantaneous. Keyboard shortcut `V` triggers view toggle.
3. **Vercel Deployment Linking**:
   - **Correct Vercel project is `morph-ui`** (`trps-urgewave/morph-ui`).
   - Do NOT link to `kg-test-849`.
   - Command to deploy to production: `npx --yes vercel --prod --yes`.
4. **Git Workflow**:
   - Active repository directory: `c:\Users\manga\hackathons\morph-ui`.
   - Main branch: `main`.
   - Always verify `npm run build` passes with zero TypeScript errors before committing.
5. **3-Tier Theme Switcher**:
   - Supports **Dark Mode** (`canvas: #09090B`), **Clean White Mode** (`#FAFAFA`), and **Cyberpunk C2C Pink Mode** (`#FF2E93` accent). Colors are controlled via CSS variables and Tailwind extensions.

---

## 6. Environment Variables (`.env.local`)

```env
# AI Models
GROQ_API_KEY=gsk_...
GEMINI_API_KEY=AIzaSy...

# Live Web Search
SERPAPI_API_KEY=...

# Database (Turso LibSQL)
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=...

# Encryption Key for AES-256-GCM
STEALTH_SECRET=...
```

---

## 7. Future Roadmap & Planned Features

1. **Multi-User Collaborative Comparisons**: Real-time shared comparison rooms via WebSockets.
2. **Export Engine**: 1-click export to Notion databases and formatted PDF comparison briefs.
3. **User Preference Weighting Sliders**: Allow users to weight priorities (e.g. Price 40%, Performance 60%) to calculate a dynamic winner score.
4. **Local Browser Inference**: WebLLM / WebGPU fallback for offline privacy mode.
