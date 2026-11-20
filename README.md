# RoutAura

**An Agentic AI route planner for professional drivers using LangChain, Groq, Fastembed, PostgreSQL, and Supabase.**

![RoutAura Interface UI](./frontend/public/icon.png)

RoutAura is a full-stack Progressive Web App (PWA) built specifically to solve the daily friction of repetitive route planning for bus drivers, delivery couriers, and professional transport contractors. Instead of repeatedly typing addresses into navigation tools, drivers can command their routes conversationally (*"Route me to the depot, then the primary school, and finish at the warehouse"*). The agent autonomously geocodes locations, parses driver intent, retrieves historical context using fuzzy SQL matching, deterministically updates routes, and generates one-tap deep links to launch external navigation apps.

This implementation demonstrates modern **Agentic AI Engineering, LLMOps Observability, and Full-Stack Cloud Deployment Protocols.**

---

## 🛠️ Technology Stack (v2.0 Architecture)

**Frontend Layer:**
- **React 18 + Vite** (Configured as an installable Progressive Web App)
- **Tailwind CSS v3** (Mobile-first Glassmorphism aesthetic with desktop sidebar & mobile bottom bar)
- **Zustand** (Synchronous client-side state management)
- **Leaflet.js & React-Leaflet** (Interactive map preview and route polyline visualization)
- **Recharts** (Interactive driving analytics and mileage trend charts)

**AI Orchestration & Infrastructure:**
- **LangChain** (Zero-Shot ReAct agent core with custom output parsing)
- **Groq API** (`llama-3.3-70b-versatile` running at low inference latency)
- **Google Gemini API** (`gemini-2.0-flash-lite` automatic fallback for zero-downtime rate limit mitigation)
- **Groq Whisper** (`whisper-large-v3` for speech-to-text voice input)
- **Fastembed** ONNX framework (`BAAI/bge-small-en-v1.5` for lightweight in-process vector embedding)
- **pgvector** (Supabase native vector storage for CDL Compliance Assistant RAG)

**Backend & Data Layer:**
- **FastAPI** (Python 3.12+ concurrent asyncio API endpoints)
- **Supabase Auth** (Handles PKCE Google OAuth, Email/Password auth, and session tokens)
- **Supabase PostgreSQL** (Cloud-scalable database with SQLAlchemy 2.0 ORM)
- **Role-Based Access Control (RBAC)** (Protected `/admin` dashboard based on user profile roles)

**Cloud Deployment Architecture:**
- **Vercel** (Frontend PWA hosting and edge caching)
- **Railway** (Containerized FastAPI backend deployment)

---

## 🏗️ System Architecture & Logic Capabilities

1. **ReAct Agent Autonomy (8 Native Tools)**: User messages pass through a ReAct reasoning loop (`Thought` → `Action` → `Observation`) utilizing 8 specialized tools:
   - `geocode_stop`: Resolves place names and street addresses into validated coordinates via Google Maps.
   - `search_saved_trips`: Searches saved trips by name using SQL `ILIKE`.
   - `search_trips_by_stop`: Finds routes containing specific locations with plural/singular normalization.
   - `get_trip_by_id`: Fetches complete ordered stop arrays for a trip.
   - `get_recent_history`: Retrieves recent launches for conversational context.
   - `save_trip`: Persists validated routes directly to PostgreSQL.
   - `modify_route`: Performs deterministic, in-place route amendments (add, remove, replace).
   - `check_compliance`: Searches official CDL driving regulations via pgvector RAG.

2. **Fuzzy Search Memory (SQL `ILIKE`)**: Every saved trip and stop is indexed in PostgreSQL. Search uses optimized SQL `ILIKE` queries with root-word normalization (e.g., "hospitals" → "hospital") ensuring 100% search reliability in ephemeral cloud environments.

3. **Retrieval-Augmented Generation (RAG) History Q&A**: Inquiries such as *"When did I last perform a Sunday run?"* invoke a pure SQL retrieval pipeline querying `trip_history` and `trips` to answer natural language questions grounded strictly in past driving records.

4. **CDL Compliance Assistant**: To answer safety and regulatory questions accurately, the agent's PRE-ANSWER COMPLIANCE GATE intercepts compliance questions and queries `pgvector` chunks of official CDL Manuals using cosine similarity (stricter **0.70 threshold**). Responses require explicit citation footers (e.g., `📚 Source: NY CDL Manual — Air Brakes, p.76`), preventing hallucinations.

5. **Multi-Model Rate Rotation (`groq_rotator`)**: High-throughput agent tasks can exceed commercial rate limits. RoutAura intercepts HTTP 429 and 503 statuses, rotating keys across a pool of models before falling back to **Google Gemini (`gemini-2.0-flash-lite`)** on the fly.

6. **Contextual LLMOps Tracking & Admin Dashboard**: Every turn logs token consumption, latency in milliseconds, model identifier, and prompt versions to `llm_logs` and `api_usage`. Users with the `admin` role can inspect live usage metrics, error logs, and provider quotas in the dedicated `/admin` dashboard.

7. **Deterministic Route State Mutation**: Rather than relying on the LLM to remember and rewrite multi-stop JSON arrays on every correction, the frontend injects `current_route` into the backend context on every request. The LLM executes the atomic `@tool("modify_route")`, and the Python backend deterministically edits the array, geocodes replacements, recalculates indices, and returns the state without array drift.

8. **Conversational Edge-Case Hardening**: The agent enforces guardrails against location ambiguities:
   - **City Mismatch Detection**: Flags discrepancies when a geocoded business resolves to a different town than requested and initiates a confirmation loop.
   - **Missing City Clarifications**: Prompts for city clarification when only a brand name is provided.
   - **Session-Aware MD5 Deduplication**: Prevents duplicate requests with a 5-second TTL cache keyed by session.

9. **Voice Input Transcription**: Drivers can speak their routes using the built-in microphone button, processed by Groq Whisper (`whisper-large-v3`).

10. **Live Route Distance & ETA**: Live driving distances and durations are calculated using the Google Directions API via `/api/v1/directions/stats`.

---

## 📚 Technical Reference Sheets

Explore deep-dive technical reasoning and architectural workflows within the dedicated engineering specifications:

- **[Technical Specification & DB Schema](./TECHNICAL_SPEC.md)**: Master schema modeling definitions, LangChain structural deployments, state fallback diagrams, and explicit API endpoint contract payloads.
- **[Product Requirements Document (PRD)](./PRD.md)**: Targeted personas, exhaustive user impact variables, product featuresets, and hiring-showcase alignment.
- **[Project Plan & Roadmap](./PROJECT_PLAN.md)**: The iterative phased mapping of the complete software lifecycle tracking the application across all 28 completed phases.
- **[Agent Control & Workflow Definitions](./CLAUDE.md)**: Standardized developer heuristics aligning collaborative toolings and logic variables.

---

## 🚀 Running Locally

*Requires active API keys for Supabase, Groq, Google Maps, and Gemini.*

### 1. Backend (FastAPI + PostgreSQL)

Using `uv` (recommended):
```bash
cd backend
uv venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
uv pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Or using standard `pip`:
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev -- --host
```

Both environments bind locally. Traffic is mediated securely through CORS pipelines against upstream Vercel/Railway instances matching your configured `CORS_ORIGINS`.
