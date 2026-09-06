# 🌐 MorphUI — Enterprise-Grade Dynamic AI Research Canvas

MorphUI is an interactive AI research and decision canvas that transforms natural language queries into dynamic, structured UI widgets laid out on a spatial canvas.

Traditional AI chats return monolithic walls of markdown text. **MorphUI replaces static text with an interactive spatial workbench**, dynamically orchestrating comparison matrices, chronological timeline calendars, categorized expense budgets, and predictive admission scorecards on demand.

---

## ✨ Key Features

- **Spatial Infinite Canvas**: Powered by `@xyflow/react` with smooth zooming, panning, auto-focus, and collision-free graph organization.
- **Dynamic Widget Architecture**:
  - **📊 Comparison Table**: Multi-column comparison with structured feature evaluation, metric badges, and categorical breakdown.
  - **📅 Timeline Calendar**: Chronological milestone tracking with date markers, event categories, and status chips.
  - **💰 Budget Tracker**: Categorized expense breakdowns with subtotal aggregations and currency formatting.
  - **🎯 Admission / Odds Predictor**: Likelihood gauges, cutoffs, criteria breakdown, and targeted strategic recommendations.
- **Zero-Hardcoding Agentic Backend**: Queries are grounded in real-time web search and structured using Google's Gemini 2.5 Flash with strict JSON schema enforcement.
- **Distributed Session Persistence**: Cloud session syncing with Turso LibSQL database for real-time collaboration and session reload.
- **Dark Glassmorphic UI**: Custom enterprise aesthetic with frosted glass, cyan/indigo glow accents, and responsive controls.

---

## 🛠️ Architecture & Tech Stack

```
User Query
    │
    ▼
Floating HUD Command Bar
    │
    ▼
POST /api/generate ──► Live Web Grounding + Gemini 2.5 Flash
    │
    ▼
Strict JSON Schema Validation
    │
    ▼
Spatial Canvas (React Flow) ◄── Widget Components
    │
    ├── ComparisonTableWidget
    ├── TimelineCalendarWidget
    ├── BudgetTrackerWidget
    └── AdmissionPredictorWidget
```

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org)
- **Language**: [TypeScript](https://www.typescriptlang.org)
- **Styling**: [Tailwind CSS](https://tailwindcss.com) + Glassmorphism
- **Canvas Engine**: [@xyflow/react](https://reactflow.dev)
- **AI Models**: Google Gemini 2.5 Flash via `@google/genai`
- **Database**: [Turso](https://turso.tech) LibSQL Client (`@libsql/client`)
- **Icons**: [Lucide React](https://lucide.dev)

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or 20.x
- npm or pnpm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/sohum123451/morph-ui.git
   cd morph-ui
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Copy `.env.example` to `.env.local` and add your API keys:
   ```bash
   cp .env.example .env.local
   ```

   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   GROQ_API_KEY=your_groq_api_key_here
   TURSO_DATABASE_URL=your_turso_db_url_here
   TURSO_AUTH_TOKEN=your_turso_auth_token_here
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 💡 Example Queries to Test

- **University Comparison**:
  > *"Compare IIT Bombay vs IIT Delhi vs BITS Pilani for Computer Science, include application deadlines and semester fee budgets."*
- **Travel Itinerary**:
  > *"Trip to Tokyo for 7 days: flight & hotel comparison, daily schedule, and itemized travel budget."*
- **SaaS Startup Roadmap**:
  > *"Launching a developer tooling SaaS: compare hosting platforms, map 90-day launch milestones, and seed runway budget."*

---

## 📄 License

MIT License. Built with ❤️ for the Hackathon.
