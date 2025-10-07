# RAG App — ChromaDB (local) + Google Gemini (embeddings & LLM)

This sample Node.js application shows a minimal Retrieval-Augmented Generation (RAG) setup:
- Upload PDFs
- Split into chunks
- Embed with Google Gemini embeddings
- Store embeddings in a local ChromaDB server
- Answer user queries using retrieved chunks + Gemini LLM

## Important notes
- **ChromaDB:** The JavaScript client expects a Chroma **server** (local or remote). You can run it locally with:
  ```bash
  pip install chromadb
  chroma run --host 0.0.0.0 --port 8000 --path ./chroma_db
  ```
  or use Docker:
  ```bash
  docker run -d --rm --name chromadb -p 8000:8000 -v $(pwd)/chroma_db:/chroma/chroma -e IS_PERSISTENT=TRUE chromadb/chroma:latest
  ```
- **Gemini (Google GenAI):** This code uses the `@google/genai` SDK. Put your API key into `.env` (see `.env.example`).

## Quick start
1. Copy `.env.example` to `.env` and fill keys.
2. Start Chroma server (see above).
3. Install Node deps:
   ```bash
   npm install
   ```
4. Start the app:
   ```bash
   npm start
   ```
5. Upload a PDF:
   ```bash
   curl -X POST -F "pdf=@/path/to/doc.pdf" http://localhost:3000/upload
   ```
6. Ask a question:
   ```bash
   curl -X POST -H "Content-Type: application/json" -d '{"question":"What is the document about?"}' http://localhost:3000/ask
   ```

## Why run a Chroma server?
- The official JS client communicates over REST to a Chroma backend (Python server). That server is what persists data on disk (or via Docker). You do **not** need Chroma Cloud.
- If you prefer a pure-Python approach, you can use `chromadb.PersistentClient` directly in Python (but then you would need a Python process to manage ingestion).

## Files in this example
- server.js — main Express app, upload and ask endpoints
- pdfLoader.js — PDF parsing
- textSplitter.js — simple chunker
- gemini.js — wrappers for embeddings + LLM call (Gemini)
- vectorStore.js — Chroma client wrapper (connects to local Chroma server)
- ragChain.js — retrieval+generation glue

---
This is an educational example. Before deploying to production, add error handling, rate-limiting, authentication, request size limits, and retry/backoff logic.

# RUN The Application:
1. chroma run --path ./chroma-data
2. npm start
### These two terminal should run at a time
