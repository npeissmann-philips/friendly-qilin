import { Router, Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { TextSplitter } from '../services/embedding/TextSplitter.js';
import { EmbeddingService } from '../services/embedding/EmbeddingService.js';
import { DatabaseService } from '../services/db/DatabaseService.js';
import { RerankerService } from '../services/embedding/RerankerService.js';
import { RagService } from '../services/embedding/RagService.js';
import { ProviderFactory } from '../services/llm/ProviderFactory.js';

export const embeddingRouter = Router();
const embeddingService = new EmbeddingService();
const dbService = new DatabaseService();
const rerankerService = new RerankerService();
const ragService = new RagService(embeddingService, dbService, rerankerService);

// Initialize the database asynchronously
dbService.initDatabase().catch(err => console.error('Failed to init DB:', err));

/**
 * @swagger
 * /api/embeddings/generate:
 *   post:
 *     summary: Generate embeddings from a local document
 *     description: Reads a document from the docs/embedding folder, splits it into chunks, and generates embeddings using the specified provider. Optionally saves to database with metadata.
 *     tags:
 *       - Embeddings
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - filename
 *             properties:
 *               filename:
 *                 type: string
 *                 description: The name of the file in the docs/embedding folder (e.g., credit_concession_policy_2026.md)
 *                 example: credit_concession_policy_2026.md
 *               provider:
 *                 type: string
 *                 enum: [gemini, local]
 *                 default: gemini
 *               chunkSize:
 *                 type: integer
 *                 default: 500
 *               chunkOverlap:
 *                 type: integer
 *                 default: 50
 *               saveToDb:
 *                 type: boolean
 *                 default: false
 *               metadata:
 *                 type: object
 *                 description: Optional JSON metadata to attach to the document chunks in the database.
 *                 example:
 *                   category: policy
 *                   year: 2026
 *     responses:
 *       200:
 *         description: Successful generation (and optional storage) of embeddings
 */
embeddingRouter.post('/embeddings/generate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { filename, provider = 'gemini', chunkSize = 500, chunkOverlap = 50, saveToDb = false, metadata = {} } = req.body;

    if (!filename) {
      res.status(400).json({ error: 'filename is required in the request body.' });
      return;
    }

    if (provider !== 'gemini' && provider !== 'local') {
      res.status(400).json({ error: 'provider must be either "gemini" or "local".' });
      return;
    }

    const baseDir = path.resolve(process.cwd(), 'docs/embedding');
    const filePath = path.resolve(baseDir, filename);

    if (!filePath.startsWith(baseDir)) {
      res.status(400).json({ error: 'Invalid filename.' });
      return;
    }

    let fileContent: string;
    try {
      fileContent = await fs.readFile(filePath, 'utf-8');
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        res.status(404).json({ error: `File not found: ${filename}` });
        return;
      }
      throw err;
    }

    const chunks = TextSplitter.splitText(fileContent, Number(chunkSize), Number(chunkOverlap));
    
    if (chunks.length === 0) {
      res.status(400).json({ error: 'File is empty or could not be chunked.' });
      return;
    }

    const embeddings = await embeddingService.generateEmbeddings(chunks, provider as 'gemini' | 'local');

    const results = chunks.map((chunk, index) => ({
      chunkIndex: index,
      text: chunk,
      embedding: embeddings[index]
    }));

    if (saveToDb) {
      for (const result of results) {
        await dbService.insertChunk(filename, result.chunkIndex, result.text, provider as string, result.embedding, metadata);
      }
    }

    res.json({
      provider,
      savedToDb: saveToDb,
      totalChunks: results.length,
      results
    });

  } catch (error: any) {
    console.error('Error in /embeddings/generate:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/embeddings/search:
 *   post:
 *     summary: Search for relevant chunks in the database (Raw Vector Search)
 *     description: Takes a text query, generates its embedding, and performs a similarity search in the database.
 *     tags:
 *       - Embeddings
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *               provider:
 *                 type: string
 *                 enum: [gemini, local]
 *                 default: gemini
 *               limit:
 *                 type: integer
 *                 default: 5
 *     responses:
 *       200:
 *         description: Search results
 */
embeddingRouter.post('/embeddings/search', async (req: Request, res: Response): Promise<void> => {
  try {
    const { query, provider = 'gemini', limit = 5 } = req.body;

    if (!query) {
      res.status(400).json({ error: 'query is required.' });
      return;
    }

    const embeddings = await embeddingService.generateEmbeddings([query], provider as 'gemini' | 'local');
    const queryVector = embeddings[0];

    const results = await dbService.searchSimilar(queryVector, provider, limit);

    res.json({ query, provider, results });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/embeddings/search-advanced:
 *   post:
 *     summary: Search with Metadata Filtering and Cross-Encoder Reranking
 *     description: Performs a vector search with optional metadata filtering, then reranks the results using a local Cross-Encoder.
 *     tags:
 *       - Embeddings
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *               provider:
 *                 type: string
 *                 enum: [gemini, local]
 *                 default: gemini
 *               limit:
 *                 type: integer
 *                 default: 3
 *                 description: Final number of reranked results to return.
 *               fetchLimit:
 *                 type: integer
 *                 default: 15
 *                 description: Number of initial results to fetch from the database before reranking.
 *               metadataFilter:
 *                 type: object
 *                 description: 'Optional JSON metadata filter (e.g., {"category": "policy"})'
 *     responses:
 *       200:
 *         description: Advanced Search results
 */
embeddingRouter.post('/embeddings/search-advanced', async (req: Request, res: Response): Promise<void> => {
  try {
    const { query, provider = 'gemini', limit = 3, fetchLimit = 15, metadataFilter = null } = req.body;

    if (!query) {
      res.status(400).json({ error: 'query is required.' });
      return;
    }

    // Step 1: Generate embedding for the query
    const embeddings = await embeddingService.generateEmbeddings([query], provider as 'gemini' | 'local');
    const queryVector = embeddings[0];

    // Step 2: Fetch initial candidates using vector search + metadata filter
    const initialCandidates = await dbService.searchSimilar(queryVector, provider, fetchLimit, metadataFilter);

    if (initialCandidates.length === 0) {
      res.json({ query, provider, results: [] });
      return;
    }

    // Step 3: Rerank the candidates
    const rerankedResults = await rerankerService.rerank(query, initialCandidates);

    // Step 4: Return top `limit` results
    const finalResults = rerankedResults.slice(0, limit);

    res.json({
      query,
      provider,
      metadataFilter,
      results: finalResults
    });

  } catch (error: any) {
    console.error('Error in /embeddings/search-advanced:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/embeddings/rag:
 *   post:
 *     summary: Query the AI using full RAG (Retrieval-Augmented Generation)
 *     description: Retrieves the most relevant document chunks from the vector database (with optional metadata filtering and cross-encoder reranking), injects them into an augmented prompt, and queries the LLM to generate a factual, grounded answer with citations. Allows inspecting how the AI consumes retrieved chunks.
 *     tags:
 *       - Embeddings
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *                 description: The user question or inquiry to answer using the stored documents.
 *                 example: "What are the strategic objectives and minimum credit score requirements for 2026?"
 *               embeddingProvider:
 *                 type: string
 *                 enum: [gemini, local]
 *                 default: gemini
 *                 description: Embedding model used to vectorize the query for semantic retrieval.
 *               llmProvider:
 *                 type: string
 *                 default: gemini
 *                 description: LLM provider name to generate the final response.
 *               model:
 *                 type: string
 *                 default: gemini-3.1-flash-lite
 *                 description: LLM model name to generate the final answer.
 *               limit:
 *                 type: integer
 *                 default: 3
 *                 description: Number of context chunks to inject into the LLM prompt.
 *               fetchLimit:
 *                 type: integer
 *                 default: 10
 *                 description: Number of candidate chunks to fetch before reranking.
 *               useReranker:
 *                 type: boolean
 *                 default: true
 *                 description: Whether to rerank retrieved chunks using a cross-encoder before context injection.
 *               metadataFilter:
 *                 type: object
 *                 description: 'Optional JSON metadata filter (e.g., {"year": 2026, "category": "policy"})'
 *                 example:
 *                   year: 2026
 *               temperature:
 *                 type: number
 *                 default: 0.2
 *                 description: LLM sampling temperature (lower is more deterministic and strictly grounded).
 *               systemInstruction:
 *                 type: string
 *                 description: Optional custom system instruction to override the default RAG grounding persona.
 *     responses:
 *       200:
 *         description: Full RAG response containing the AI answer, retrieved context chunks, and the augmented prompt sent to the LLM.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 query:
 *                   type: string
 *                 answer:
 *                   type: string
 *                 context:
 *                   type: array
 *                   items:
 *                     type: object
 *                 promptSentToLLM:
 *                   type: object
 *                   properties:
 *                     systemInstruction:
 *                       type: string
 *                     userPrompt:
 *                       type: string
 *                 metadata:
 *                   type: object
 *       400:
 *         description: Bad request (missing query)
 *       500:
 *         description: Internal server error
 */
const handleRagRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      query,
      embeddingProvider = 'gemini',
      llmProvider = 'gemini',
      model = 'gemini-3.1-flash-lite',
      limit = 3,
      fetchLimit = 10,
      useReranker = true,
      metadataFilter = null,
      temperature = 0.2,
      systemInstruction: customSystemInstruction,
    } = req.body;

    if (!query || typeof query !== 'string' || !query.trim()) {
      res.status(400).json({ error: 'Field "query" is required and must be a non-empty string.' });
      return;
    }

    if (embeddingProvider !== 'gemini' && embeddingProvider !== 'local') {
      res.status(400).json({ error: 'embeddingProvider must be either "gemini" or "local".' });
      return;
    }

    // Step 1-3: Delegate embedding generation, vector search, and reranking to RagService
    const searchResult = await ragService.retrieveChunks({
      query,
      embeddingProvider: embeddingProvider as 'gemini' | 'local',
      limit: Number(limit) || 3,
      fetchLimit: Number(fetchLimit) || 10,
      useReranker: Boolean(useReranker),
      metadataFilter,
    });

    const retrievedChunks = searchResult.chunks;

    // If no context was retrieved at all
    if (retrievedChunks.length === 0) {
      res.json({
        query,
        answer: 'No relevant documents were found in the database matching your query or filter criteria. Please check your query or generate embeddings first.',
        context: [],
        promptSentToLLM: null,
        metadata: {
          llmProvider,
          modelUsed: model,
          embeddingProvider,
          chunksRetrieved: 0,
          usedReranker: Boolean(useReranker),
        },
      });
      return;
    }

    // Step 4: Construct the augmented prompt and system instructions (Prompt Engineering)
    const formattedContext = retrievedChunks
      .map((chunk, index) => {
        return `[Source Excerpt ${index + 1}]\nDocument: ${chunk.filename} (Chunk Index: ${chunk.chunk_index})\nContent:\n${chunk.text.trim()}`;
      })
      .join('\n\n---\n\n');

    const defaultSystemInstruction =
      'You are a reliable, factual enterprise AI assistant. Your job is to answer the user query based ONLY on the provided document excerpts.\n\n' +
      'Rules:\n' +
      '1. Strictly ground your answer in the provided context excerpts. Do NOT assume, fabricate, or extrapolate information not supported by the excerpts.\n' +
      '2. If the excerpts do not contain enough facts to answer the question, clearly state: "Based on the provided documents, I do not have enough information to answer this question."\n' +
      '3. Always cite the document filename and chunk index when referring to specific facts or figures (e.g., "[credit_concession_policy_2026.md, Chunk 0]").\n' +
      '4. Keep answers concise, objective, well-formatted, and helpful.';

    const systemInstruction = customSystemInstruction || defaultSystemInstruction;

    const userPrompt =
      `Context excerpts from knowledge base:\n\n${formattedContext}\n\n` +
      `---------------------\n` +
      `User Question: ${query}\n\n` +
      `Provide a thorough, grounded answer referencing the sources above:`;

    // Step 5: Send augmented prompt to the LLM
    const providerInstance = ProviderFactory.getProvider(llmProvider);
    const llmResult = await providerInstance.generate({
      systemInstruction,
      prompt: userPrompt,
      temperature: Number(temperature),
      model,
    });

    // Step 6: Return the complete RAG inspection payload
    res.json({
      query,
      answer: llmResult.text,
      context: retrievedChunks.map((chunk) => ({
        id: chunk.id,
        filename: chunk.filename,
        chunk_index: chunk.chunk_index,
        similarity: chunk.similarity,
        rerank_score: chunk.rerank_score !== undefined ? chunk.rerank_score : null,
        metadata: chunk.metadata,
        text: chunk.text,
      })),
      promptSentToLLM: {
        systemInstruction,
        userPrompt,
      },
      metadata: {
        llmProvider,
        modelUsed: llmResult.modelUsed,
        embeddingProvider,
        chunksRetrieved: retrievedChunks.length,
        usedReranker: Boolean(useReranker),
      },
    });
  } catch (error: any) {
    console.error('Error in /embeddings/rag:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

embeddingRouter.post('/embeddings/rag', handleRagRequest);
embeddingRouter.post('/embeddings/ask', handleRagRequest);

