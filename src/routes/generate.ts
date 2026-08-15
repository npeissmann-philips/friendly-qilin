import { Router, Request, Response } from 'express';
import { ProviderFactory } from '../services/llm/ProviderFactory.js';

export const generateRouter = Router();

/**
 * @openapi
 * /api/generate:
 *   post:
 *     summary: Generate text using specified LLM prompt engineering options
 *     tags:
 *       - Generation
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - prompt
 *             properties:
 *               systemInstruction:
 *                 type: string
 *                 description: System prompt to set AI persona or behavioral rules
 *                 example: "You are a helpful coding assistant specialized in Node.js and TypeScript."
 *               prompt:
 *                 type: string
 *                 description: The user prompt or question
 *                 example: "Explain how to handle async errors in Express middleware."
 *               temperature:
 *                 type: number
 *                 format: float
 *                 description: Controls randomness (0.0 = deterministic, 2.0 = highly creative)
 *                 example: 0.7
 *               maxOutputTokens:
 *                 type: integer
 *                 description: Maximum number of tokens to generate in response
 *                 example: 500
 *               provider:
 *                 type: string
 *                 description: LLM provider name (defaults to 'gemini')
 *                 example: "gemini"
 *               model:
 *                 type: string
 *                 description: Specific model identifier (defaults to 'gemini-3.1-flash-lite')
 *                 example: "gemini-3.1-flash-lite"
 *     responses:
 *       200:
 *         description: Successfully generated response from LLM
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 text:
 *                   type: string
 *                 modelUsed:
 *                   type: string
 *                 provider:
 *                   type: string
 *       400:
 *         description: Bad request (missing prompt or invalid input)
 *       500:
 *         description: Error executing prompt against LLM
 */
generateRouter.post('/generate', async (req: Request, res: Response) => {
  try {
    const { systemInstruction, prompt, temperature, maxOutputTokens, provider, model } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({ error: 'Field "prompt" is required and must be a string.' });
      return;
    }

    const llmProvider = ProviderFactory.getProvider(provider || 'gemini');

    const result = await llmProvider.generate({
      systemInstruction,
      prompt,
      temperature: temperature !== undefined ? Number(temperature) : undefined,
      maxOutputTokens: maxOutputTokens !== undefined ? Number(maxOutputTokens) : undefined,
      model,
    });

    res.json(result);
  } catch (error: any) {
    console.error('Error generating content:', error);
    res.status(500).json({
      error: 'Failed to generate content',
      details: error?.message || String(error),
    });
  }
});
