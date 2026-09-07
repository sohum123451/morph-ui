# 🌐 MorphUI — Real-Time Generative Multi-Entity Comparison & Spatial Intelligence Engine

MorphUI is a dual-engine comparison and spatial intelligence platform that transforms complex entity comparisons into **interactive side-by-side spec sheets**, **multi-dimensional de-biased community consensus matrices**, and **cinematic 3D WebGL spatial command centers**.

Traditional AI tools return long, unstructured walls of text. **MorphUI replaces text dumps with a real-time generative dual-view workbench**, synthesizing live multi-source web facts, structured Reddit community sentiments, and interactive 3D spatial node topologies on demand.

---

## ✨ Key Capabilities

- ⚡ **Dual-Engine Spatial Viewport**:
  - Seamlessly toggle between **Structured Spec Sheet View** and **Cinematic 3D WebGL Spatial Canvas** (Three.js / `@react-three/fiber` / `@react-three/drei` with 2D ReactFlow fallback).
  - Press `V` to switch views instantly.
- 🌌 **Full-Scale Interactive Command Center**:
  - Immersive full-screen 3D data command center with smooth camera flight controls.
  - Physics-driven spring nodes, particle dust fields, and glowing data-stream energy bridges.
  - Playable HUD with interactive **Recharts Radar Spectrum charts** and dimension sliders.
- 🛡️ **Pre-Flight Semantic Entity Validation**:
  - Pre-flight classification evaluates entity domain compatibility before initiating live tool calls or SERP lookups.
  - Gracefully aborts comparisons between completely unrelated domains (e.g. tech company vs fresh fruit vs software tool) unless a unifying context topic is provided.
  - Displays a clean dark-mode clarification state on the canvas with actionable refinement guidance.
- 📊 **Exhaustive Extraction & Minimal Asterisk Notation**:
  - Guaranteed non-empty matrix cells across all compared dimensions with authentic domain-tailored specs and synthetic fallback estimation.
  - Clean, clutter-free design: bulky "AI consensus" badges are replaced with a minimal asterisk (`*`) notation next to synthesized metrics.
  - Subtle bottom footnote: `* Metrics marked with an asterisk represent AI-synthesized consensus estimates derived from multi-source data extraction.`
- 🗣️ **4-Pillar Granular Reddit & Forum Sentiment**:
  - Structured extraction across 4 mandatory dimensions:
    1. *Build Quality / Curriculum Depth*
    2. *Price-to-Value Ratio & Worth-It Verdict*
    3. *Durability / Long-Term Reliability (6+ Months)*
    4. *Common User Complaints & Buyer Remorse*
- 🔀 **N-Way Multi-Entity Comparisons**: Compare 2, 3, 4, or more entities in parallel (e.g., `React vs Vue vs Svelte`, `Sony WH-1000XM5 vs Bose QC Ultra vs AirPods Max`).
- 🎨 **Adaptive Three-Tier Theme System**:
  - **🌙 Dark Mode** (`#09090b` Cyber-Tactical Slate)
  - **☀️ Clean White Mode**
  - **🌸 Cyberpunk C2C Pink Mode** with `localStorage` state persistence.
- 🚀 **Multi-Model LLM Orchestration Cascade**:
  1. **Groq (`openai/gpt-oss-120b`)**: Ultra-fast structured precision extraction.
  2. **Google Gemini 3.6 Flash (`gemini-3.6-flash`)**: High-accuracy fallback.
  3. **Direct Parametric Knowledge Synthesis**: Seamless fallback if search APIs are throttled.
- 🧠 **Stale-While-Revalidate (SWR) Cache**:
  - Instant cache hits with background detached revalidation.
  - Circuit breaker protection and jitter stampede mitigation.
- 🔐 **Turso DB & AES-256-GCM Stealth Encryption**:
  - Encrypted comparison session persistence using `AES-256-GCM` and SHA-256 key derivation.
  - In-memory database fallback for zero-configuration local execution.
  - Responsive History sidebar with 1-click comparison restoration.
- 🖼️ **Multimodal Visual Inputs & Voice Search**: Upload screenshots/images for visual fact extraction or use the Web Speech API for real-time voice queries.
- ➕ **Dynamic AI Metric Expansion**: One-click AI-suggested comparison metric addition with optimistic UI updates.

---

## 🛠️ Architecture & Data Pipeline

```
User Query (Text, Voice, or Multimodal Image)
       │
       ▼
Pre-Flight Semantic Entity Validation (Groq / Gemini)
       ├── Incompatible (e.g., Shoe vs Quantum Theory) ──► Return 422 Clarification State
       └── Compatible / Contextualized
               │
               ▼
SWR Caching Layer (Upstash / Memory Map + Jitter)
       ├── Cache Hit (<20h) ──► Return Instant Matrix (0ms)
       ├── Stale (20-24h) ──► Immediate Return + Background Revalidation
       └── Miss ──► Parallel Retrieval Pipeline
                        ├── SerpApi / Multi-Source Live Web Retrieval
                        ├── Multi-Model Cascade (Groq OSS 120B ──► Gemini 3.6 Flash)
                        ├── Grounding Token Verification & Consensus Normalization
                        └── AES-256-GCM Encryption ──► Turso Database
                                │
                                ▼
         Dual-View Rendering Engine (Spec Sheet / 3D Spatial Canvas)
```

- **Framework**: [Next.js (App Router)](https://nextjs.org) (v16+)
- **Language**: [TypeScript](https://www.typescriptlang.org)
- **3D Spatial Engine**: [Three.js](https://threejs.org), [@react-three/fiber](https://r3f.docs.pmnd.rs), [@react-three/drei](https://github.com/pmndrs/drei)
- **2D Flow Engine**: [@xyflow/react](https://reactflow.dev)
- **Charts & Telemetry**: [Recharts](https://recharts.org)
- **AI Models**: Groq (`openai/gpt-oss-120b`) & Google Gemini 3.6 Flash (`@google/genai`)
- **Database**: [Turso](https://turso.tech) LibSQL Client (`@libsql/client`)
- **Encryption**: Node.js `crypto` with `AES-256-GCM`
- **Styling**: [Tailwind CSS](https://tailwindcss.com) + Dark-Mode Cyber-Tactical Design System
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

## 💡 Example Queries to Explore

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
| `T` | Cycle Color Themes (Dark / Light / Cyberpunk) |
| `R` | Reset 3D Camera to Center Focus |

---

## 📄 License

MIT © 2026 MorphUI
