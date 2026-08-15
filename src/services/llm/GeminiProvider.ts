import { GoogleGenAI } from '@google/genai';
import { LLMProvider, GenerateRequest, GenerateResponse } from './LLMProvider.js';

export class GeminiProvider implements LLMProvider {
  name = 'gemini';
  private ai: GoogleGenAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('Warning: GEMINI_API_KEY environment variable is not set.');
    }
    this.ai = new GoogleGenAI({ apiKey: apiKey || '' });
  }

  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    const modelName = request.model || 'gemini-3.1-flash-lite';

    const config: Record<string, any> = {};

    if (request.systemInstruction) {
      config.systemInstruction = request.systemInstruction;
    }

    if (request.temperature !== undefined) {
      config.temperature = request.temperature;
    }

    if (request.maxOutputTokens !== undefined) {
      config.maxOutputTokens = request.maxOutputTokens;
    }

    const response = await this.ai.models.generateContent({
      model: modelName,
      contents: request.prompt,
      config: Object.keys(config).length > 0 ? config : undefined,
    });

    return {
      text: response.text || '',
      modelUsed: modelName,
      provider: this.name,
    };
  }
}
