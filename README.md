# 🌐 MorphUI — Real-Time Generative Multi-Entity Comparison Engine

MorphUI is a dual-engine comparison platform that transforms complex entity comparisons into **interactive side-by-side spec sheets**, **de-biased consensus summaries**, and **spatial graph models**.

Traditional AI chats return long walls of text. **MorphUI replaces unstructured text with a real-time generative dual-view workbench**, synthesizing live multi-source web facts, structured Reddit community sentiments, and spatial knowledge graphs on demand.

---

## ✨ Key Capabilities

- ⚡ **Dual-Engine Viewport**: Seamlessly toggle between **Structured Spec Sheet View** and **Spatial Canvas Graph View** (`@xyflow/react`) with keyboard shortcut `V`.
- 🔀 **N-Way Multi-Entity Comparisons**: Compare 2, 3, 4, or more entities in parallel (e.g. `React vs Vue vs Svelte`, `Sony WH-1000XM5 vs Bose QC Ultra vs AirPods Max`).
- 🎨 **Three-Tier Theme Switcher**: Instant switching between **🌙 Dark Mode**, **☀️ Clean White Mode**, and **🌸 Cyberpunk C2C Pink Mode** with `localStorage` persistence.
- 🚀 **Multi-Model LLM Cascade**:
  1. **Groq (`llama-3.3-70b-versatile`)**: Ultra-fast structured extraction.
  2. **Google Gemini 2.5 Flash (`@google/genai`)**: High-accuracy fallback.
  3. **Direct Parametric Fallback**: Seamless fallback if search APIs are throttled.
- 🧠 **Stale-While-Revalidate (SWR) Cache**:
  - Instant cache response for frequently requested comparisons.
  - Background detached revalidation with circuit breaker protection against rate limits.
  - Jitter stampede protection.
- 🛡️ **Turso DB & AES-256-GCM Stealth Encryption**:
  - Encrypted comparison session persistence using `AES-256-GCM`.
  - In-memory database fallback if external credentials are not set.
  - Responsive History sidebar drawer with 1-click comparison restoration.
- 🖼️ **Multimodal Visual Inputs**: Upload screenshots or product images for visual fact extraction.
- 🎙️ **Web Speech Voice Search**: Real-time voice query transcription.
- ➕ **Resilient AI Metric Expansion**: Click any AI-suggested comparison metric chip with optimistic inline loading and non-blocking fallbacks.

---

## 🛠️ Architecture & Tech Stack

```
User Query (Text, Voice, or Image)
       │
       ▼
SWR Caching Layer (Upstash / Memory Map + Jitter)
       ├── Hit (<20h) ──► Instant Return (0ms)
       ├── Stale (20-24h) ──► Immediate Return + Background Revalidation
       └── Miss ──► Parallel Retrieval Pipeline
                        ├── SerpApi Live Web Search
                        ├── Multi-Model LLM Cascade (Groq ──► Gemini 2.5 Flash)
                        └── AES-256-GCM Encryption ──► Turso DB
                                │
                                ▼
         Dual-View Rendering Engine (Spec Sheet / Spatial Canvas)
```

- **Framework**: [Next.js (App Router)](https://nextjs.org)
- **Language**: [TypeScript](https://www.typescriptlang.org)
- **Styling**: [Tailwind CSS](https://tailwindcss.com) + Dynamic CSS Design System
- **Canvas Engine**: [@xyflow/react](https://reactflow.dev)
- **AI Models**: Groq (`llama-3.3-70b-versatile`) & Google Gemini 2.5 Flash
- **Database**: [Turso](https://turso.tech) LibSQL Client (`@libsql/client`)
- **Encryption**: Node.js `crypto` with `AES-256-GCM` & SHA-256 Key Derivation
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
   SERPAPI_API_KEY=your_serpapi_key_here
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

## 💡 Example Queries to Test

- **Multi-Entity Tech Comparison**: `React vs Vue vs Svelte: DX & Performance`
- **Consumer Electronics**: `Sony WH-1000XM5 vs Bose QC Ultra vs AirPods Max`
- **Academic Institutions**: `IIT Bombay vs IIT Delhi for Computer Science`
- **Scientific Concepts**: `Primary Cell vs Secondary Cell`
- **Footwear & Apparel**: `Nike Pegasus 41 vs Adidas Ultraboost Light`

---

## 📄 License

MIT © 2026 MorphUI
