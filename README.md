# 🤖 LLM & AI Agent Architecture Study Roadmap

[🌐 **Português (Brasil)**](README.pt-BR.md)

This repository is a hands-on study project focused on mastering **Prompt Engineering, RAG (Retrieval-Augmented Generation), Tool Calling, Agent Orchestration (LangChain / LangGraph), and LLMOps**.

The ultimate goal is to build a solid foundation in Artificial Intelligence Architecture applicable to complex enterprise scenarios.

---

## 🛠️ Tech Stack & Tools

- **Runtime & Language:** Node.js, TypeScript
- **Web Framework:** Express.js, Swagger UI (`swagger-ui-express`)
- **LLM Providers:** Google Gemini API (`@google/genai`), OpenAI API
- **AI Frameworks:** LangChain.js, LangGraph
- **Vector Databases:** pgvector (PostgreSQL), Pinecone, Weaviate
- **LLMOps & Observability:** LangSmith
- **DevOps & Containers:** Docker, Docker Compose

---

## 📅 Learning Roadmap

### 🎯 Phase 1: API Fundamentals & Prompt Engineering (Week 1)
*Understanding raw model behavior and controlling model outputs.*

- [ ] **Direct API Consumption:** Building a simple project in Node.js/TypeScript to make raw API calls to OpenAI or Gemini without heavy frameworks.
- [ ] **System Prompts vs. User Prompts:** Learning how to instruct personas, business logic, and strict constraints in System Prompts.
- [ ] **Model Parameters:** Experimenting with `Temperature` (creativity vs. precision) and `Max Tokens`.
- [ ] **Structured Prompting:**
  - **Few-Shot Prompting:** Providing contextual examples directly in the prompt.
  - **Chain of Thought (CoT):** Requesting the model to explain its step-by-step reasoning before outputting the final answer.

---

### 🧠 Phase 2: The RAG Pattern (Retrieval-Augmented Generation) (Week 2)
*Enabling the AI to query custom and private corporate databases.*

- [ ] **Embeddings:** Transforming text chunks into high-dimensional numerical vectors.
- [ ] **Vector Databases:** Spinning up a local or free cloud instance of pgvector (PostgreSQL extension), Pinecone, or Weaviate.
- [ ] **Full RAG Pipeline:**
  1. Reading and parsing content from PDFs or web pages.
  2. **Chunking:** Splitting documents into optimal, semantically meaningful text chunks.
  3. Generating embeddings and storing them in the vector database.
  4. **Search Route:** Converting user queries into vectors, performing similarity search (Cosine, Euclidean), and injecting retrieved context into the LLM prompt.

---

### 🛠️ Phase 3: Tool Calling & The Dawn of Agents (Week 3)
*Transforming the LLM from a text generator into an action-taking agent.*

- [x] **Function / Tool Calling:**
  - Defining JSON Schemas describing application functions (e.g., `count_database_files`, `query_rag_knowledge_base`).
  - Handling the LLM's structured JSON response requesting execution of function X with parameters Y.
  - Executing local code and passing results back to the LLM to formulate the final answer.
- [ ] **Introduction to LangChain:**
  - Using LangChain.js to encapsulate complex pipelines.
  - Building `Chains` connecting the LLM to simulated tools (e.g., mock APIs for Zip Code lookup, weather, or currency exchange).

---

### 🔄 Phase 4: Orchestration & Complex Workflows (Week 4)
*Building multi-agent systems and cyclic workflows.*

- [ ] **LangGraph:**
  - Designing cyclic graph workflows instead of linear chains.
  - Creating decision nodes where agents evaluate their own output, validate quality, and decide whether to refine or conclude.
- [ ] **Multi-Agent Architectures:**
  - Exploring architectural concepts of specialized agents (Researcher Agent, Reviewer Agent, Manager Agent).
  - Replicating multi-agent orchestration patterns using LangGraph in TypeScript/Node.js.

---

### 🛡️ Phase 5: Governance & Production (LLMOps)
*Operating, monitoring, and securing enterprise AI applications.*

- [ ] **AI Observability:** Integrating logging and monitoring tools like **LangSmith** to track token usage, latency, and debug LLM calls.
- [ ] **LLM Security:**
  - Mitigating **Prompt Injection** attacks (direct and indirect).
  - Sanitizing and redacting **PII (Personally Identifiable Information)** for privacy compliance (LGPD/GDPR).
- [ ] **Response Streaming:** Implementing **Server-Sent Events (SSE)** in the backend to stream responses to the frontend in real-time.

---

## 📂 Suggested Project Structure

```text
.
├── src/
│   ├── phase-1-prompting/     # Direct API calls, Few-Shot, CoT experiments
│   ├── phase-2-rag/           # Chunking, Embeddings, Vector DB pipeline
│   ├── phase-3-tools/         # Function Calling & LangChain Chains
│   ├── phase-4-langgraph/     # Decision Graphs & Multi-Agent Orchestration
│   ├── phase-5-llmops/        # Observability, SSE Streaming, PII/Prompt Injection filters
│   ├── routes/                # Express API routes
│   ├── services/              # LLM Service integrations (Gemini, OpenAI)
│   ├── swagger.ts             # Swagger UI documentation setup
│   └── server.ts              # Application entry point
├── docker-compose.yml         # Containerized Vector DB (pgvector/Weaviate)
├── Dockerfile
├── .env.example
├── package.json
├── README.md                  # English README
└── README.pt-BR.md            # Portuguese README
```

---

## 🚦 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn
- Docker Desktop (optional, for local vector database)

### 1. Clone the repository and install dependencies

```bash
npm install
```

### 2. Environment Variables Setup

Create a `.env` file based on `.env.example`:

```env
PORT=3000
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=your_langsmith_api_key_here
DATABASE_URL=postgresql://user:password@localhost:5432/vector_db
```

### 3. Run Development Server

```bash
npm run dev
```

Access Swagger Documentation at: `http://localhost:3000/api-docs`.

---

## 📄 License

This project is intended strictly for educational and self-study purposes.
