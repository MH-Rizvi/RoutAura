# RouteEasy - Project Description

RouteEasy is an AI-powered conversational route-planning application. It allows users to query an intelligent agent to generate optimized, multi-stop routes, which are then geocoded and saved. The app uses a hybrid database approach (SQLite for relational data and ChromaDB for vector-based semantic routing) alongside a Retrieval-Augmented Generation (RAG) pipeline to support natural language history queries.

## Technology Stack

**Frontend:**
- **Framework:** React 18, React Router DOM, Vite
- **State Management:** Zustand
- **Styling:** Tailwind CSS, PostCSS
- **Mapping:** Leaflet, React-Leaflet
- **Data Fetching/Client:** Axios
- **Interactions:** React-Beautiful-DND (Drag and Drop)

**Backend:**
- **Framework:** FastAPI, Uvicorn
- **Database (Relational):** SQLite (via SQLAlchemy)
- **Database (Vector/Semantic):** ChromaDB, HuggingFace embeddings (`all-MiniLM-L6-v2`) via `sentence-transformers`
- **Data Validation & Settings:** Pydantic
- **AI/LLM Agent:** Groq API powered Llama-3 (70b), integrated via LangChain
- **Geocoding API:** Google Maps Geocoding API

## Core Concepts

1. **ReAct LLM Agent:** The core of the conversational interface is a LangChain ReAct agent powered by Groq. It dynamically routes user requests, determining when to geocode places, when to search for trips, and when to respond naturally.
2. **Hybrid Database Architecture:** The app saves structured trip data to SQLite, and simultaneously embeds the trip sequences into ChromaDB. 
3. **Retrieval-Augmented Generation (RAG):** When asking historical questions, the backend queries the vector database for cosine-similarity matches to ground the LLM's responses.
4. **Resilient Geocoding:** The backend includes a Geocoding service that strictly biases results to a default city and parses exact coordinate data to guarantee locations map correctly before presenting them to the user.

---

## Backend Directory Structure (`/backend`)

The backend is built as a modular FastAPI application to clearly separate routing, DB models, AI logic, and business services.

**Root level files:**
* `app/main.py`: The FastAPI app entry point. Sets up CORS, exception handling, and mounts all the routers.
* `requirements.txt` / `pyproject.toml` / `uv.lock`: Python package dependency trees.
* `app/config.py`: Loads environment variables via Pydantic settings.
* `app/database.py`: SQLAlchemy setup, creating the database engine, base classes, and session dependancies.
* `app/models.py`: SQLAlchemy ORM definitions for tables like `Trip`, `Stop`, and `AgentLog`.
* `app/schemas.py`: Pydantic definitions used to validate incoming HTTP requests and format API responses.

**`app/agent/` - LangChain LLM Logic:**
* `core.py`: Initializes the LangChain executor and coordinates the execution loop.
* `tools.py`: Defines the strictly typed tools the LLM can invoke (e.g., Geocoding, Stop Search, History Fetch).
* `prompts.py`: Houses the system prompt instructions that guide the Llama 3 model's persona, decision-making, and output formatting.
* `callbacks.py`: Tracks token usage and execution latency, feeding to the LLMOps metrics module.
* `output_parser.py`: Parses the ReAct LLM outputs to structure them for the frontend API response payload.

**`app/routers/` - API Endpoints:**
* `agent.py`: Handles POST requests for the conversational Chat Agent endpoints.
* `trips.py`: The core CRUD endpoints for saving, updating, retrieving, and deleting Trips/Stops.
* `history.py`: Retrieves user trip history context.
* `rag.py`: Endpoint dedicated to querying the RAG pipeline via ChromaDB context extraction.
* `admin.py`: Access point for LLMOps telemetry and logging metadata.
* `voice.py`: Manages endpoints for Whisper-based speech-to-text transcriptions interactions.

**`app/services/` - Business Logic Layer:**
* `geocoding_service.py`: Interfaces with the Google Maps Geocoding integration, performing location biasing and parsing.
* `vector_service.py`: Initializes and queries ChromaDB using `SentenceTransformer` collections.
* `trips_service.py`: Abstracts the logic of orchestrating trip creation between SQLite and Vector DB.
* `rag_service.py`: Orchestrates similarity search mapping contexts directly to the LLM.
* `llm_client.py` & `groq_client.py`: Establish the direct HTTP/SDK boundaries with the Groq inference engine.
* `moderation_service.py`: Intercepts unsafe user prompts before passing to the agent.

---

## Frontend Directory Structure (`/frontend`)

The frontend is a single-page React app bundled natively by Vite.

**Root level files:**
* `package.json` / `package-lock.json`: NPM package descriptors and lockfiles.
* `vite.config.js`: Configuration for the Vite bundler.
* `tailwind.config.js` / `postcss.config.js`: Thematic and utility configurations for Tailwind.
* `index.html`: Base HTML template injecting the React root.
* `src/main.jsx`: Primary React DOM rendering orchestrator.
* `src/App.jsx`: Global router configuration handling application "shells" and tab navigation.
* `src/index.css`: Tailwind entrypoint housing custom UI classes and styling variables.

**`src/screens/` - Major Page Views:**
* `ChatScreen.jsx`: The central conversational AI view. Integrates `ChatInput` and displays an interactive map of the proposed route during discussion.
* `PreviewScreen.jsx`: The pre-save confirmation view. Employs React-Beautiful-DND to let users re-order stops manually. Handles mapping Apple/Google Maps deep links dynamically.
* `TripDetailScreen.jsx`: Dedicated view for an already-saved Trip. Shows final stops and navigation options.
* `TripsScreen.jsx`: Lists the user's saved trips. Includes `SemanticSearchBar` to perform fuzzy similarity search against ChromaDB.
* `HomeScreen.jsx`: A quick-launch dashboard rendering recent trips and shortcut actions.
* `HistoryScreen.jsx`: Displays historical activity utilizing the RAG LLM integration.
* `LLMLogsScreen.jsx`: Administrative dashboard showing request tokens, prompts, and operation latency.

**`src/components/` - Reusable UI Modules:**
* `ChatInput.jsx`: A text box customized for smooth text resizing.
* `VoiceInputButton.jsx`: Microphone interface interfacing with `voice.py` on the backend.
* `MessageBubble.jsx`: Modular speech bubble formatter supporting formatting parsing.
* `StopList.jsx` / `StopItem.jsx`: List components iterating over arrays of places to format addresses uniformly.
* `MapPreview.jsx`: Leaflet instantiation component displaying visual pins on the map based on coordinate arrays.
* `TripCard.jsx`: Reusable preview item representing individual summary data for saved trips.
* `SaveTripModal.jsx`: Modal popup UI for finalizing route metadata on save.
* `SemanticSearchBar.jsx`: Input box performing instant queries against Vector storage.

**`src/store/` - Zustand State Management:**
* `chatStore.js`: Orchestrates the ephemeral state of the currently active conversation, including the proposed map stops in memory before save.
* `tripStore.js`: Provides structured client-side caching of fetched saved trips, managing rapid UI updates for CRUD events.

**`src/api/` & `src/utils/` - Helpers:**
* `api/client.js`: Global configured Axios instance defining interceptors and BASE_URL resolving logic.
* `utils/mapsLinks.js`: A logic matrix utility determining how to construct URL schemas specifically bypassing blockages for Google Maps (`https://www.google.com/maps/dir/...`) and Apple Maps (`http://maps.apple.com/...`). 
