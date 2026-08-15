export interface GenerateRequest {
  systemInstruction?: string;
  prompt: string;
  temperature?: number;
  maxOutputTokens?: number;
  model?: string;
}

export interface GenerateResponse {
  text: string;
  modelUsed: string;
  provider: string;
}

export interface LLMProvider {
  name: string;
  generate(request: GenerateRequest): Promise<GenerateResponse>;
}
