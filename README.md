# ⚡ MorphUI - Real-Time Generative Multi-Entity Comparison & Spatial Intelligence Engine

[![Live Demo](https://img.shields.io/badge/Live_Demo-morph--ui--pi.vercel.app-0070f3?style=for-the-badge&logo=vercel)](https://morph-ui-pi.vercel.app)
[![Framework](https://img.shields.io/badge/Next.js-16.3.4-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://react.dev)
[![Primary LLM](https://img.shields.io/badge/Primary_LLM-Gemini_2.5_Flash-4285F4?style=for-the-badge&logo=google)](https://deepmind.google/technologies/gemini/)
[![Security](https://img.shields.io/badge/Encryption-AES--256--GCM-green?style=for-the-badge)](https://en.wikipedia.org/wiki/Galois/Counter_Mode)

MorphUI is a dual-engine comparison and spatial intelligence platform that transforms complex entity comparisons into **interactive side-by-side spec sheets**, **multi-dimensional de-biased community consensus matrices**, and **cinematic 3D WebGL spatial command centers**.

Traditional AI tools return long, unstructured walls of text. **MorphUI replaces text dumps with a real-time generative dual-view workbench**, synthesizing live multi-source web facts, structured Reddit community sentiments, and interactive 3D spatial node topologies on demand.

---

## 🌟 Key Capabilities

- 🔄 **Dual-Engine Spatial Viewport**:
  - Seamlessly toggle between **Structured Spec Sheet View** and **Cinematic 3D WebGL Spatial Canvas** (Three.js / `@react-three/fiber` / `@react-three/drei` with 2D ReactFlow fallback).
  - Press `V` to switch views instantly.
- 🎮 **Full-Scale Interactive Command Center**:
  - Immersive full-screen 3D data command center with smooth camera flight controls.
  - Physics-driven spring nodes, particle dust fields, and glowing data-stream energy bridges.
  - Playable HUD with interactive **Recharts Radar Spectrum charts** and dimension sliders.
- 🛡️ **Pre-Flight Semantic Entity Validation**:
  - Pre-flight classification evaluates entity domain compatibility before initiating live tool calls or SERP lookups.
  - Gracefully aborts comparisons between completely unrelated domains (e.g. tech company vs fresh fruit vs software tool) unless a unifying context topic is provided.
  - Displays a clean clarification state on the canvas with actionable refinement guidance.
- 📊 **Exhaustive Extraction & Minimal Asterisk Notation**:
  - Guaranteed non-empty matrix cells across all compared dimensions with authentic domain-tailored specs and synthetic fallback estimation.
  - Clean, clutter-free design: bulky "AI consensus" badges are replaced with a minimal asterisk (`*`) notation next to synthesized metrics.
  - Footnote: `* Metrics marked with an asterisk represent AI-synthesized consensus estimates derived from multi-source data extraction.`
- 💬 **4-Pillar Granular Reddit & Forum Sentiment**:
  - Structured extraction across 4 mandatory dimensions:
    1. *Build Quality / Curriculum Depth*
    2. *Price-to-Value Ratio & Worth-It Verdict*
    3. *Durability / Long-Term Reliability (6+ Months)*
    4. *Common User Complaints & Buyer Remorse*
- 🔀 **N-Way Multi-Entity Comparisons**: Compare 2, 3, 4, or more entities in parallel (e.g., `React vs Vue vs Svelte`, `Sony WH-1000XM5 vs Bose QC Ultra vs AirPods Max`).
- 🎨 **Adaptive Three-Tier Theme System**:
  - **Dark Mode** (`#09090b` Cyber-Tactical Slate)
  - **Clean White Light Mode**
  - **Botanical Forest Mode** with state persistence.
- 🤖 **Multi-Tier LLM Orchestration Cascade**:
  1. **Google Gemini 2.5 Flash** (`gemini-2.5-flash` via `@google/genai` v2.20.0): Primary inference model for structured matrix extraction & multimodal vision reasoning.
  2. **NVIDIA NIM API** (`meta/llama-3.1-70b-instruct` & `nvidia/nemotron-4-70b-instruct`): High-throughput reasoning tier.
  3. **Groq SDK** (`llama-3.3-70b-versatile`): Ultra-fast fallback inference.
- 🔒 **AES-256-GCM Encryption & Turso DB**:
  - Authenticated payload encryption at rest using `AES-256-GCM` with SHA-256 key derivation.
  - Edge database storage using Turso LibSQL (`@libsql/client`).
- 📷 **Multimodal Visual Inputs & Voice Search**: Upload screenshots/images for visual fact extraction or use the Web Speech API for real-time voice queries.

---

## 🔒 Security & Encryption Architecture

MorphUI is engineered with strict security and privacy standards:

1. **AES-256-GCM Payload Encryption at Rest**:
   - Implemented in [`lib/crypto.ts`](file:///lib/crypto.ts).
   - Chat sessions and comparison message payloads are encrypted with `AES-256-GCM` using SHA-256 derived keys, 16-byte random IVs, and 128-bit Auth Tags before being saved to the database.
2. **TLS 1.3 Transport Encryption**:
   - All network traffic between browser client, API routes, database, and LLM endpoints is transmitted over encrypted TLS 1.3 HTTPS/WSS channels.
3. **Server-Side API Key Encapsulation**:
   - API keys for Google Gemini, NVIDIA NIM, and Groq are strictly bound inside serverless execution contexts. **No API keys or secret tokens are ever exposed to the client browser**.
4. **NextAuth.js OAuth 2.0 & Session Security**:
   - Google OAuth 2.0 authentication with encrypted JWT session strategy stored in `HttpOnly`, `SameSite=Lax` cookies.
5. **Zod Runtime Validation**:
   - All inbound payloads and SSE streams are validated against strict Zod schemas (`lib/schemas.ts`), preventing SQL/Prompt injections and malformed data crashes.

---

## 🏗️ Architecture & Data Pipeline

```
User Query (Text, Voice, or Multimodal Image)
       │
       ▼
Pre-Flight Semantic Entity Validation (Gemini 2.5 Flash)
       ├── Incompatible (e.g., Shoe vs Quantum Theory) ──► Return 422 Clarification State
       └── Compatible / Contextualized
               │
               ▼
SWR Caching Layer (Upstash / Memory Map + Jitter)
       ├── Cache Hit (<20h) ──► Return Instant Matrix (0ms)
       ├── Stale (20-24h) ──► Immediate Return + Background Revalidation
       └── Miss ──► Parallel Multi-Model Retrieval Cascade
                        ├── Multi-Source Live Web Retrieval (SerpApi / Exa)
                        ├── Gemini 2.5 Flash ──► NVIDIA NIM ──► Groq Fallback
                        ├── Grounding Token Verification & Consensus Normalization
                        └── AES-256-GCM Encryption ──► Turso Database
                                │
                                ▼
         Dual-View Rendering Engine (Spec Sheet / 3D Spatial Canvas)
```

- **Framework**: [Next.js (App Router)](https://nextjs.org) (v16.3.4)
- **Language**: [TypeScript](https://www.typescriptlang.org) 5
- **Primary LLM**: [Google Gemini 2.5 Flash](https://deepmind.google/technologies/gemini/) (`@google/genai` v2.20.0)
- **Fallback LLMs**: NVIDIA NIM (`llama-3.1-70b`) & Groq SDK (`llama-3.3-70b-versatile`)
- **3D Spatial Engine**: [Three.js](https://threejs.org), [@react-three/fiber](https://r3f.docs.pmnd.rs), [@react-three/drei](https://github.com/pmndrs/drei)
- **2D Flow Engine**: [@xyflow/react](https://reactflow.dev)
- **Charts & Telemetry**: [Recharts](https://recharts.org)
- **Database**: [Turso](https://turso.tech) LibSQL Client (`@libsql/client`)
- **Encryption**: Node.js `crypto` with `AES-256-GCM`
- **Styling**: [Tailwind CSS](https://tailwindcss.com) + Multi-Theme Design System
- **Icons**: [Lucide React](https://lucide.dev)

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or 20.x+
- npm, pnpm, or yarn

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/sohum123451/morph-ui.git
   cd morph-ui
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Create a `.env.local` file from the `.env.example` template:
   ```bash
   cp .env.example .env.local
   ```

   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   NVIDIA_API_KEY=your_nvidia_api_key_here
   GROQ_API_KEY=your_groq_api_key_here
   TURSO_DATABASE_URL=your_turso_db_url_here
   TURSO_AUTH_TOKEN=your_turso_auth_token_here
   STEALTH_SECRET=your_secret_passphrase_here
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🎯 Example Queries to Explore

- **Smartphones**: `iPhone 16 Pro vs Galaxy S25 Ultra: Camera & Battery Life`
- **Multi-Entity Frameworks**: `React vs Vue vs Svelte vs Angular: Performance & DX`
- **Academic Institutions**: `MIT vs Stanford for Computer Science`
- **Consumer Audio**: `Sony WH-1000XM5 vs Bose QC Ultra vs AirPods Max`
- **Athletic Footwear**: `Nike Pegasus 41 vs Adidas Ultraboost 5`
- **Disparate Entities (with Context)**: `Apple vs Banana: Nutritional Value & Potassium`
- **Disparate Entities (Triggering Validation)**: `Apple Inc vs Banana vs PostgreSQL` *(Triggers semantic compatibility warning)*

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
| --- | --- |
| `V` | Toggle between Spec Sheet & 3D Spatial Canvas View |
| `Space` | Enter / Exit Full-Scale Interactive Command Center |
| `Esc` | Exit Full-Scale View / Close Modals |
| `T` | Cycle Color Themes (Dark / Light / Botanical) |
| `R` | Reset 3D Camera to Center Focus |

---

## 📄 License

MIT © 2026 MorphUI
