let pipeline: any = null;

export class RerankerService {
  /**
   * Reranks a list of documents based on their relevance to a query.
   * Uses Xenova's cross-encoder for semantic similarity.
   */
  async rerank(query: string, documents: any[]): Promise<any[]> {
    if (documents.length === 0) return [];

    try {
      if (!pipeline) {
        const transformers = await import('@xenova/transformers');
        transformers.env.allowLocalModels = false;
        transformers.env.useBrowserCache = false;
        // Load cross-encoder model
        pipeline = transformers.pipeline;
      }

      const reranker = await pipeline('text-classification', 'Xenova/ms-marco-MiniLM-L-6-v2', {
        quantized: true,
      });

      // Prepare inputs. Cross-encoder expects pairs of [query, documentText]
      // Wait, transformers.js text-classification takes strings.
      // Actually, for cross-encoders in transformers.js, we pass a single string formatted like:
      // "query text [SEP] document text" or pass them as a pair if the pipeline supports it.
      // In Xenova/transformers, we can pass `{ text: query, text_pair: document }` for cross-encoders.
      
      const pairs = documents.map(doc => ({
        text: query,
        text_pair: doc.text
      }));

      // Reranker processes an array of pairs
      const scores = await reranker(pairs);

      // Map scores back to documents
      // Some models return { label: 'LABEL_0', score: 0.9 }, some return multiple labels.
      // Usually the score representing relevance is either the single score returned or a specific label.
      // ms-marco returns a single score for relevance.
      
      const scoredDocuments = documents.map((doc, index) => {
        // If it returns an array of objects for each pair
        const score = Array.isArray(scores) ? (scores[index].score || 0) : 0;
        return {
          ...doc,
          rerank_score: score
        };
      });

      // Sort descending by rerank_score
      scoredDocuments.sort((a, b) => b.rerank_score - a.rerank_score);

      return scoredDocuments;
    } catch (error) {
      console.error('Error in reranking:', error);
      // Fallback to original order if reranking fails
      return documents;
    }
  }
}
