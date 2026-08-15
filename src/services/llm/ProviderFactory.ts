import { LLMProvider } from './LLMProvider.js';
import { GeminiProvider } from './GeminiProvider.js';

export class ProviderFactory {
  private static providers: Map<string, LLMProvider> = new Map();

  public static getProvider(name: string = 'gemini'): LLMProvider {
    const normalizedName = name.toLowerCase();

    if (this.providers.has(normalizedName)) {
      return this.providers.get(normalizedName)!;
    }

    let provider: LLMProvider;

    switch (normalizedName) {
      case 'gemini':
        provider = new GeminiProvider();
        break;
      // Future providers (e.g., 'openai', 'anthropic') can be easily registered here:
      // case 'openai':
      //   provider = new OpenAIProvider();
      //   break;
      default:
        throw new Error(`Unsupported LLM provider: '${name}'. Available providers: gemini`);
    }

    this.providers.set(normalizedName, provider);
    return provider;
  }
}
