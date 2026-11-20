# Product Requirements Document (PRD)
## RoutAura — Agentic AI Trip Planner for Professional Drivers
### Portfolio Showcase Edition — Built for GenAI / Agentic AI Engineer Roles

**Version:** 2.1  
**Date:** March 2026  
**Status:** Deployed via Railway/Vercel (Production)

---

## 1. Project Overview

### 1.1 Problem Statement
School bus drivers, delivery couriers, and logistics transport contractors manually re-enter identical routes into generic navigation platforms continuously. Traditional navigation platforms lack conversational understanding, offer zero long-term memory of recurring routing sequences, and cannot answer domain-specific driving compliance questions on the fly. Drivers need an intelligent, hands-free assistant that remembers custom locations, resolves vague stops conversationally, and provides instant regulatory answers.

### 1.2 Solution
RoutAura is a full-stack Progressive Web App (PWA) powered by a **LangChain-orchestrated Zero-Shot ReAct AI agent** empowering users to manage routes conversationally. The deployed Agent isolates intent, engages custom backend toolkits to geocode ambiguous addresses, and uses high-performance PostgreSQL `ILIKE` pattern matching to retrieve historical trips and stops with zero vector database drift.

Every route config is stored in **Supabase PostgreSQL**, enabling fast fuzzy recall (e.g., "The usual PM run"). The History Q&A RAG pipeline uses pure SQL retrieval, ensuring grounded facts without hallucinations. For regulatory and safety questions, a specialized **CDL Compliance Assistant** queries NY CDL Manuals using `pgvector` embeddings.

### 1.3 Agentic Engineering Architectures
RoutAura avoids archaic direct-LLM generation paradigms representing naive chatbot workflows. It coordinates multi-turn autonomous tool execution:

```
Driver says: "do my usual monday morning run"

Agent Step 1 → THOUGHT: The driver wants to load a saved trip.
Agent Step 1 → ACTION: search_saved_trips("monday morning run")
Agent Step 1 → OBSERVATION: Found 1 trip(s) matching 'monday morning run':
              - 'Monday Morning School Run' (trip_id: 12, stop_count: 5)

Agent Step 2 → THOUGHT: Exactly one matching trip found. I must fetch the stops immediately.
Agent Step 2 → ACTION: get_trip_by_id("12")
Agent Step 2 → OBSERVATION: { id: 12, name: "Monday Morning School Run", stops: [...] }

Agent Step 3 → THOUGHT: Trip loaded. Route state updated for the UI.
Agent Step 3 → FINAL ANSWER: "I've loaded your 'Monday Morning School Run' with 5 stops! Check the route card above to preview."
```

*(Note: User identity is managed via Supabase UUIDs, while entity primary keys like `trip_id` and `stop_id` are standard relational integers).*

### 1.4 Core Objectives
- Eliminate manual geographic data-entry friction for professional drivers.
- Construct a showcase codebase explicitly demonstrating Agentic Engineering (ReAct loops, deterministic state mutations, rate-limit fallback rotation).
- Provide an enterprise-grade multi-layer architecture: FastAPI asyncio backend, Supabase Auth with RBAC, PostgreSQL relational data + pgvector compliance embeddings, and a responsive Tailwind CSS Glassmorphism PWA.

---

## 2. Target Users

| User Type | Description |
|-----------|-------------|
| **Primary** | School bus operators assigned repetitive daily pick-up and drop-off sequences |
| **Secondary** | Medical transport and regional logistics delivery drivers navigating multi-stop runs |
| **Administrative** | Fleet managers / Admins reviewing LLMOps metrics, API token expenditure, and error logs |
| **Showcase Audience** | Senior Engineering Hiring Managers evaluating Agentic AI, LLMOps, and Cloud deployments |

---

## 3. Core Featuresets

| # | Feature | Technology / Architecture Demonstrated |
|---|---------|----------------------------------------|
| F1 | Multi-Model LLM Rotation Fallbacks (`groq_rotator`) | Intelligent 1-strike rate-limit mitigation (Groq Llama 3.3 to Gemini `gemini-2.0-flash-lite`) |
| F2 | LangChain Zero-Shot ReAct Orchestration | 8 autonomous native tools with structured output parsing |
| F3 | Single-Parameter Geocoding Extractor Logic | Natural language query parsing with state dictionary center bias |
| F4 | Fuzzy Stop Search (PostgreSQL `ILIKE`) | Case-insensitive pattern matching with singular-root normalization |
| F5 | Fuzzy Trip Search (PostgreSQL `ILIKE`) | High-reliability name matching across saved routes |
| F6 | RAG Trip History QA System | Context-grounded historical queries via pure SQL aggregation |
| F7 | Supabase PostgreSQL & Auth Persistence | Cloud-scalable relational tables, PKCE OAuth + Email/Password flows |
| F8 | Role-Based Access Control (RBAC) | Secure user profile tiers (`user` vs `admin`) with `/admin` dashboard |
| F9 | Premium Glassmorphism UI | React 18, Tailwind CSS v3, dark aesthetic, responsive mobile & desktop navigation |
| F10 | LLMOps Tracking & Admin Analytics | Token expenditure, model latency, error logging (`llm_logs`, `api_usage`) |
| F11 | Public/Secure Hybrid Landing Page Logic | Interactive live demo chat with IP rate-limiting (10 req/hour) |
| F12 | Deterministic Route State Mutation | Python-managed atomic array operations (`modify_route`) preventing array hallucinations |
| F13 | Conversational Edge-Case Hardening | City mismatch detection, interactive confirmation loops, session-aware MD5 deduplication |
| F14 | CDL Compliance Assistant | `pgvector` RAG pipeline over NY CDL Manuals with strict citation footers (threshold: 0.70) |
| F15 | Voice Input Transcription | Audio transcription via Groq Whisper (`whisper-large-v3`) |
| F16 | State-Biased Places Autocomplete | Server-side Google Places Autocomplete with geographic center biasing |
| F17 | Live Route Distance & Duration Stats | Real-time mileage and duration calculation via Google Directions API |

---

## 4. Agentic Integrations (Detailed)

### F1 + F2 — Multi-Model LLM Fleets & LangChain ReAct
The Agent core operates on the **Groq API (`llama-3.3-70b-versatile`)**. If rate limits or service overloads occur (HTTP 429/503), requests are automatically rotated across available Groq keys and fallback models before falling back to **Google Gemini (`gemini-2.0-flash-lite`)**. The agent has access to 8 native tools:
1. `geocode_stop`: Resolves street names or landmarks to validated coordinates.
2. `search_saved_trips`: Fuzzy SQL search for saved trips by name.
3. `search_trips_by_stop`: Fuzzy SQL search for trips containing specific locations.
4. `get_trip_by_id`: Retrieves complete ordered stop arrays for a trip.
5. `get_recent_history`: Retrieves recent launches for context.
6. `save_trip`: Persists validated routes directly into the database.
7. `modify_route`: Deterministically mutates the active route array (add, remove, replace).
8. `check_compliance`: RAG retriever querying CDL regulations with citations.

### F4 + F5 — Fuzzy SQL Memory (PostgreSQL `ILIKE`)
Trip and stop recall leverages SQL `ILIKE` queries with automatic plural handling and root-word normalization (e.g., "hospitals" → "hospital"). This ensures 100% search reliability in cloud deployments without dual-write vector synchronization issues.

### F6 — RAG Deep Historical QA
Drivers query their past activity conversationally:
1. User: *"When did I last perform the East Side Route?"*
2. System fetches up to 20 recent `trip_history` records and user `trips` via SQLAlchemy.
3. Formats summary stats (total trips, miles driven) and formatted logs into a restricted context prompt.
4. LLM answers factually based strictly on the retrieved records.

### F14 — CDL Compliance Assistant
1. User: *"What is the minimum tread depth for front tires?"*
2. PRE-ANSWER COMPLIANCE GATE intercepts the prompt and enforces the `check_compliance` tool.
3. Query is embedded using `fastembed` (`BAAI/bge-small-en-v1.5`) and searched against Supabase `compliance_chunks` using `pgvector` cosine similarity (`<=>`) with a **0.70 similarity threshold**.
4. Retrieves relevant chunks from official NY CDL PDFs (ingested via `pypdf`).
5. Generates an accurate answer appending a required citation footer (e.g., `📚 Source: NY CDL Manual — Air Brakes, p.76`).

### F10 — LLMOps Tracing & Admin Observability
Every LLM turn records token usage (prompt and completion tokens), model name, latency in milliseconds, prompt version, and error traces into `llm_logs`. The Admin Dashboard exposes visual metrics, token trends, and API consumption across providers.

---

## 5. Non-Functional Architecture Traits

| Category | Requirement |
|----------|-------------|
| **System Resiliency** | 1-strike immediate key/model rotation on HTTP 429/503; automatic fallback to Gemini |
| **Response Latency** | Direct SQL searches <50ms; pgvector compliance retrieval <200ms |
| **Cross-Platform PWA** | Mobile bottom tab bar + desktop sidebar, installable manifest, Apple Maps & Google Maps deep-links |
| **Security & Privacy** | Supabase Auth Bearer tokens, password hashing, admin route guards (`admin_required`), parameterized SQL queries |
| **Accessibility** | High contrast dark mode, touch-friendly hitboxes (≥48px), responsive scroll containers |

---

## 6. Real-World Engineering Showcase Alignment

| Job Description Expectation | RoutAura Implementation |
|-----------------------------|-------------------------|
| Complex Backend Orchestration | Python 3.12+ FastAPI with asyncio and contextvars request-scoping |
| Multi-LLM API Integrations | Groq Llama 3.3 rotated with Google Gemini (`gemini-2.0-flash-lite`) |
| Robust Tool Use & ReAct Loops | LangChain AgentExecutor with 8 tools, retry heuristics, and deterministic array mutations |
| Vector & Hybrid Search | `pgvector` embeddings for compliance knowledge + PostgreSQL `ILIKE` for business records |
| Production Cloud Deployment | Railway (FastAPI container) + Vercel (React Vite SPA) + Supabase (Cloud Postgres & Auth) |
| Speech & Vision / Audio | Groq Whisper (`whisper-large-v3`) voice transcription integration |
| LLMOps & Observability | Custom LangChain callbacks logging latency and token counts into Postgres |
