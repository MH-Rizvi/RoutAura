# Technical Specification — RoutAura v2.0
## Architecture & Implementation Blueprint (Agentic AI Edition)

**Version:** 2.1  
**Date:** March 2026  
**Status:** Deployed via Railway/Vercel

---

## 1. Technology Stack

### Current Implementation Layout

| Layer | Technology | Version | Description & Reason |
|-------|-----------|---------|-----------------------|
| **Frontend** | React 18 + Vite | 18.2+ | Fast, component-based PWA architecture |
| **Styling** | Tailwind CSS | v3.4+ | Mobile-first utility classes with dark Glassmorphism theme |
| **State Management** | Zustand | v4.5+ | Synchronous client-side stores (`chatStore`, `tripStore`, `authStore`) |
| **Data Visualization** | Recharts | v3.7+ | Historical driving analytics and mileage charts |
| **Mapping & Geodata** | Leaflet + React-Leaflet | 1.9+ / 4.2+ | OpenStreetMap preview rendering and waypoint polyline display |
| **Backend Framework** | FastAPI (Python) | 0.110+ | Async REST APIs with native Pydantic validation & OpenAPI docs |
| **AI Orchestration** | LangChain | 0.3+ | ReAct Agent loop (`create_react_agent`, `AgentExecutor`) |
| **Primary LLMs** | Groq API (`llama-3.3-70b-versatile`) | Latest | Low-latency ReAct reasoning (<800ms) with dynamic model rotation pool |
| **Fallback LLMs** | Google Gemini (`gemini-2.0-flash-lite`) | Latest | Automatic 1-strike rate-limit fallback via `groq_rotator` |
| **Audio Transcription** | Groq Whisper (`whisper-large-v3`) | Latest | Audio transcription via `/api/v1/voice/transcribe` |
| **Embeddings** | Fastembed (`BAAI/bge-small-en-v1.5`) | Latest | In-process ONNX embeddings for CDL compliance vectors without PyTorch |
| **Vector DB (Compliance)** | Supabase `pgvector` | Latest | Cosine distance (`<=>`) vector search over NY CDL manual chunks |
| **Search Engine** | PostgreSQL SQL `ILIKE` | — | High-performance fuzzy matching for saved trips and stops |
| **Relational DB** | Supabase PostgreSQL | Latest | SQLAlchemy 2.0 ORM over remote managed Postgres instance |
| **Auth & Identity** | Supabase Auth | Latest | Email/Password and Google PKCE OAuth token issuance |
| **Deployment** | Railway + Vercel | — | Containerized FastAPI on Railway + Static PWA CDN on Vercel |

---

## 2. System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                          User's Device (PWA)                           │
│  ┌──────────────┐  ┌────────────────┐  ┌───────────────┐  ┌─────────┐  │
│  │   Chat UI    │  │  Trips Library │  │  Map Preview  │  │  Admin  │  │
│  │ (Agent Chat) │  │ (SQL Search)   │  │ (Leaflet/OSM) │  │ (LLMOps)│  │
│  └──────────────┘  └────────────────┘  └───────────────┘  └─────────┘  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP REST + Bearer JWT Token
┌───────────────────────────────────▼────────────────────────────────────┐
│                           FastAPI Backend                              │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                   LangChain ReAct Agent Core                     │  │
│  │                                                                  │  │
│  │   Driver Message → Moderation → ReAct Loop:                     │  │
│  │   THOUGHT → ACTION (Tool Call) → OBSERVATION → repeat            │  │
│  │                                                                  │  │
│  │   Tools (8):                                                     │  │
│  │   1. geocode_stop        (Google Maps Geocoding API)             │  │
│  │   2. search_saved_trips  (PostgreSQL SQL ILIKE)                  │  │
│  │   3. search_trips_by_stop(PostgreSQL SQL ILIKE with Plural Root) │  │
│  │   4. get_trip_by_id      (Fetch ordered stops from PostgreSQL)   │  │
│  │   5. get_recent_history  (Recent trip launches for context)      │  │
│  │   6. save_trip           (Direct route persistence)              │  │
│  │   7. modify_route        (Deterministic Python array operations) │  │
│  │   8. check_compliance    (pgvector CDL RAG search + citations)   │  │
│  │                                                                  │  │
│  │   Callback Handler: LLMOpsCallbackHandler logs to `llm_logs`     │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ┌─────────────────────────────────┐  ┌─────────────────────────────┐  │
│  │      History Q&A Pipeline       │  │  CDL Compliance Pipeline    │  │
│  │  SQL Retrieval → Context Prompt │  │  Fastembed + pgvector       │  │
│  │  → Groq Llama 3.3 Completion    │  │  Threshold: 0.70 + Citation │  │
│  └─────────────────────────────────┘  └─────────────────────────────┘  │
│                                                                        │
│  ┌─────────────────────────────────┐  ┌─────────────────────────────┐  │
│  │       Direction & Places        │  │      Admin & Analytics      │  │
│  │  Google Directions (/directions)│  │  LLM Logs, API Quotas       │  │
│  │  Google Places (/places)        │  │  RBAC Check (role == admin) │  │
│  └─────────────────────────────────┘  └─────────────────────────────┘  │
│                                                                        │
│  External APIs:                                                        │
│  - Groq API (Llama 3.3 70B & Whisper Large v3)                         │
│  - Google Gemini API (gemini-2.0-flash-lite fallback)                  │
│  - Google Maps Geocoding, Places Autocomplete & Directions APIs        │
│  - Supabase Auth & PostgreSQL                                          │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Database Schema

All user relationships reference Supabase Auth UUIDs (`auth.users(id)`). Entity primary keys (`trips.id`, `stops.id`, `trip_history.id`, `llm_logs.id`) are standard relational auto-incrementing integers.

```sql
-- User Profile metadata attached to Supabase Auth
CREATE TABLE IF NOT EXISTS user_profiles (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  birthday VARCHAR(50),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(50) NOT NULL,
  zip_code VARCHAR(20) NOT NULL,
  full_location VARCHAR(200) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Saved Trips
CREATE TABLE IF NOT EXISTS trips (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_used TIMESTAMP,
  use_count INTEGER DEFAULT 0
);

-- Ordered Stops belonging to a Trip
CREATE TABLE IF NOT EXISTS stops (
  id SERIAL PRIMARY KEY,
  trip_id INTEGER REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  position INTEGER NOT NULL DEFAULT 0,
  label VARCHAR(255) NOT NULL,
  resolved TEXT NOT NULL,
  lat FLOAT NOT NULL,
  lng FLOAT NOT NULL,
  note TEXT
);

-- Trip launch history (feeds History Q&A and Stats)
CREATE TABLE IF NOT EXISTS trip_history (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_id INTEGER REFERENCES trips(id) ON DELETE SET NULL,
  trip_name VARCHAR(200),
  raw_input TEXT,
  stops_json TEXT NOT NULL,
  launched_at TIMESTAMP DEFAULT NOW(),
  total_miles FLOAT
);

-- LLMOps Observability logging
CREATE TABLE IF NOT EXISTS llm_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  timestamp TIMESTAMP DEFAULT NOW(),
  model VARCHAR(100) NOT NULL,
  prompt_version VARCHAR(50) NOT NULL,
  input_tokens INTEGER,
  output_tokens INTEGER,
  latency_ms INTEGER,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  run_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- API Rate Limit & Usage tracking
CREATE TABLE IF NOT EXISTS api_usage (
  id SERIAL PRIMARY KEY,
  api_name VARCHAR(100) NOT NULL,
  date VARCHAR(50) NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0
);

-- CDL Compliance Chunks (pgvector)
CREATE TABLE IF NOT EXISTS compliance_chunks (
  id SERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  embedding vector(384),
  jurisdiction VARCHAR(20),
  source VARCHAR(200),
  chapter VARCHAR(200),
  section VARCHAR(100),
  page INTEGER,
  doc_type VARCHAR(50),
  state VARCHAR(10)
);

CREATE INDEX IF NOT EXISTS compliance_chunks_embedding_idx
ON compliance_chunks
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

---

## 4. Single-Parameter Geocoding Extractor Logic

The `geocode_stop` tool interface accepts a free-text string description of a stop.

To prevent coordinate hallucinations outside the driver's geographic region:
1. `_extract_state_from_query()` checks for US state abbreviations or names.
2. If no state is specified in the query, it biases coordinates toward the driver's profile location (`user_city`).
3. Out-of-state stops explicitly include state identifiers to override regional center biasing.

---

## 4.5. Deterministic Route State Mutation (`modify_route`)

To prevent LLM array-truncation hallucinations during multi-turn edits, RoutAura maintains route state deterministically:
1. The frontend injects the active route array (`current_route`) into every backend chat request.
2. The route is stored in a Python `contextvars.ContextVar` (`active_route_ctx`).
3. When the user modifies a route (e.g., "replace stop 2 with Walmart"), the agent calls `@tool("modify_route")` with parameters:
   ```json
   {
     "action": "replace",
     "position": 2,
     "query": "Walmart Jericho",
     "place_name": "Walmart"
   }
   ```
4. The Python backend geocodes the replacement stop, mutates the list in place, re-indexes stop positions (`0, 1, 2...`), and returns the updated state to the frontend, bypassing LLM text-to-JSON serialization.

---

## 4.6. Conversational Edge-Case Hardening & Deduplication TTL

1. **City Mismatch Detection:** If a user specifies a target location (e.g., "Walmart Jericho") but geocoding resolves to a different town (e.g., "Westbury"), `modify_route` detects the discrepancy and prompts the user for confirmation. On user consent, the agent re-executes with `"confirmed": true`.
2. **Missing City Clarification:** When only a brand name is given without a city ("make it Target"), the agent is mandated by prompt to ask "Which city?" before geocoding.
3. **Session-Aware MD5 Request Deduplication:** The backend calculates `hashlib.md5(f"{session_id}:{message}")` with a 5-second TTL cleanup. This stops duplicate double-clicks from spawning duplicate ReAct loops while allowing identical messages across different browser sessions.

---

## 5. History Q&A Pipeline (Pure SQL)

1. User asks: *"When was the last time I went to Oak Street?"*
2. `rag_service.py` queries `trip_history` and `trips` via SQLAlchemy for the authenticated `user_id`.
3. Lifetime statistics (total trips, lifetime miles) and the last 20 trip launches with resolved stops are compiled into structured context.
4. The prompt strictly instructs the LLM to answer using only the provided context. If no matching records exist, it returns a polite disclaimer.

---

## 5.5. CDL Compliance RAG Pipeline (`pgvector`)

1. User asks a regulatory or safety question: *"What is the maximum air brake leakage rate?"*
2. The PRE-ANSWER COMPLIANCE GATE intercepts the prompt and triggers `check_compliance`.
3. `fastembed` embeds the query using `BAAI/bge-small-en-v1.5` into a 384-dimensional vector.
4. Supabase `pgvector` performs cosine similarity search (`1 - (embedding <=> :q_vec)`) filtered by jurisdiction (`WHERE jurisdiction IN ('federal', 'all', :state)`).
5. If the highest similarity is below the **0.70 threshold**, the agent safely returns a refusal rather than hallucinating.
6. If valid chunks are found, the agent synthesizes the answer and appends the mandatory citation:
   `📚 Source: NY CDL Manual — Air Brakes, p.76`

---

## 6. Authentication & Authorization Workflows

1. **Session & Token Management:**
   - The React frontend uses `@supabase/supabase-js` to handle email/password sign-in and Google PKCE OAuth.
   - Every API request attaches the access token: `Authorization: Bearer <supabase_access_token>`.
2. **Backend Authentication (`app/auth.py`):**
   - The `get_current_user` dependency validates the token using `supabase.auth.get_user(token)`.
   - On expiration (401), the frontend Axios interceptor automatically requests a refreshed session from Supabase.
3. **Role-Based Access Control (`admin_required`):**
   - Endpoints in `/admin` chain the `admin_required` dependency, verifying `user_profiles.role == 'admin'` in PostgreSQL before granting access.

---

## 7. Configuration Specifications

### Backend `.env` Keys

```bash
# LLM Providers & Rotator
GROQ_API_KEY=gsk_...
GROQ_API_KEY_1=gsk_...
GROQ_API_KEY_2=gsk_...
GROQ_API_KEY_3=gsk_...
GROQ_API_KEY_4=gsk_...

GEMINI_API_KEY_1=AIza...
GEMINI_API_KEY_2=AIza...
GEMINI_API_KEY_3=AIza...
GEMINI_API_KEY_4=AIza...
GEMINI_API_KEY_5=AIza...

# Supabase Postgres & Auth
SUPABASE_URL=https://[project-id].supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DATABASE_URL=postgresql://postgres:[password]@db.[project-id].supabase.co:5432/postgres

# External Integrations
GOOGLE_MAPS_API_KEY=AIza...

# App Configuration
DEFAULT_CITY=New York, NY
CORS_ORIGINS=["http://localhost:5173","https://your-production-domain.vercel.app"]
ACTIVE_PROMPT_VERSION=agent_v1
```

### Frontend Configuration (`.env`)

```bash
VITE_API_BASE_URL=https://your-railway-backend.up.railway.app/api/v1
VITE_SUPABASE_URL=https://[project-id].supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```
