import { EmbeddingService } from './EmbeddingService.js';
import { DatabaseService } from '../db/DatabaseService.js';
import { RerankerService } from './RerankerService.js';

export interface RagSearchOptions {
  query: string;
  embeddingProvider?: 'gemini' | 'local';
  limit?: number;
  fetchLimit?: number;
  useReranker?: boolean;
  metadataFilter?: any;
}

export interface RetrievedChunk {
  id: number;
  filename: string;
  chunk_index: number;
  text: string;
  provider: string;
  similarity: number;
  rerank_score?: number | null;
  metadata?: any;
}

export interface RagSearchResult {
  query: string;
  chunks: RetrievedChunk[];
  totalRetrieved: number;
  embeddingProvider: string;
  usedReranker: boolean;
}

export class RagService {
  private embeddingService: EmbeddingService;
  private dbService: DatabaseService;
  private rerankerService: RerankerService;

  constructor(
    embeddingService?: EmbeddingService,
    dbService?: DatabaseService,
    rerankerService?: RerankerService
  ) {
    this.embeddingService = embeddingService || new EmbeddingService();
    this.dbService = dbService || new DatabaseService();
    this.rerankerService = rerankerService || new RerankerService();
  }

  async retrieveChunks(options: RagSearchOptions): Promise<RagSearchResult> {
    const {
      query,
      embeddingProvider = 'gemini',
      limit = 3,
      fetchLimit = 10,
      useReranker = true,
      metadataFilter = null,
    } = options;

    if (!query || typeof query !== 'string' || !query.trim()) {
      throw new Error('Query must be a non-empty string.');
    }

    // Step 1: Generate embedding for the query
    const embeddings = await this.embeddingService.generateEmbeddings(
      [query],
      embeddingProvider as 'gemini' | 'local'
    );
    const queryVector = embeddings[0];

    // Step 2: Retrieve candidate chunks from pgvector
    const numCandidatesToFetch = useReranker
      ? Math.max(Number(fetchLimit) || 10, Number(limit) || 3)
      : (Number(limit) || 3);

    const initialCandidates = await this.dbService.searchSimilar(
      queryVector,
      embeddingProvider,
      numCandidatesToFetch,
      metadataFilter
    );

    let retrievedChunks: RetrievedChunk[] = [];

    if (initialCandidates.length > 0) {
      if (useReranker) {
        // Step 3: Rerank candidates using Cross-Encoder
        const reranked = await this.rerankerService.rerank(query, initialCandidates);
        retrievedChunks = reranked.slice(0, Number(limit) || 3);
      } else {
        retrievedChunks = initialCandidates.slice(0, Number(limit) || 3);
      }
    }

    return {
      query,
      chunks: retrievedChunks.map((chunk) => ({
        id: chunk.id,
        filename: chunk.filename,
        chunk_index: chunk.chunk_index,
        text: chunk.text,
        provider: chunk.provider,
        similarity: chunk.similarity,
        rerank_score: chunk.rerank_score !== undefined ? chunk.rerank_score : null,
        metadata: chunk.metadata,
      })),
      totalRetrieved: retrievedChunks.length,
      embeddingProvider,
      usedReranker: Boolean(useReranker),
    };
  }
}
