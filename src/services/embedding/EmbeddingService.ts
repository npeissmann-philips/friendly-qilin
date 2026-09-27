import { GoogleGenAI } from '@google/genai';

// Dynamically import to avoid blocking startup if not installed properly yet
let pipeline: any = null;

export class EmbeddingService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
  }

  async generateEmbeddings(
    texts: string[],
    provider: 'gemini' | 'local'
  ): Promise<number[][]> {
    if (provider === 'gemini') {
      return this.generateGeminiEmbeddings(texts);
    } else {
      return this.generateLocalEmbeddings(texts);
    }
  }

  private async generateGeminiEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const embeddings: number[][] = [];
      // Note: @google/genai might support batching natively, but we loop for safety
      // across different SDK versions.
      for (const text of texts) {
        const response = await this.ai.models.embedContent({
          model: 'gemini-embedding-2',
          contents: text,
        });
        
        // Ensure we correctly extract the embedding values
        if (response.embeddings && response.embeddings.length > 0 && response.embeddings[0].values) {
             embeddings.push(response.embeddings[0].values);
        } else {
            console.warn("Unexpected embedding response format from Gemini");
            embeddings.push([]); 
        }
      }
      return embeddings;
    } catch (error) {
      console.error('Error generating Gemini embeddings:', error);
      throw new Error('Failed to generate embeddings using Gemini.');
    }
  }

  private async generateLocalEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      if (!pipeline) {
        const transformers = await import('@xenova/transformers');
        // Configure to not use local cache in a way that breaks if directory is missing
        transformers.env.allowLocalModels = false;
        transformers.env.useBrowserCache = false;
        pipeline = transformers.pipeline;
      }

      const embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
      
      const embeddings: number[][] = [];
      for (const text of texts) {
         const result = await embedder(text, { pooling: 'mean', normalize: true });
         // The output is a tensor, we need to convert it to an array.
         // result.tolist() returns a multidimensional array (e.g., [[0.1, 0.2, ...]])
         const list = result.tolist();
         embeddings.push(list[0]);
      }
      
      return embeddings;
    } catch (error) {
      console.error('Error generating local embeddings:', error);
      throw new Error('Failed to generate embeddings using local model.');
    }
  }
}
