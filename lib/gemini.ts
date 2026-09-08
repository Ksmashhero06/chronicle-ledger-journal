import { GoogleGenAI, Type } from '@google/genai';

export const MODEL_FALLBACK_CHAIN = [
  'gemini-3.6-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.7-flash',
];

export interface FallbackOptions {
  contents: any;
  systemInstruction?: string;
  responseMimeType?: string;
  responseSchema?: any;
  preferredModel?: string;
  temperature?: number;
}

export interface FallbackResult {
  text: string;
  modelUsed: string;
}

/**
 * Executes Gemini content generation using a resilient fallback ladder.
 * Automatically recovers from 503, 429, 404, 500 status codes by cycling models.
 */
export async function generateContentWithFallback(options: FallbackOptions): Promise<FallbackResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in the server environment.');
  }

  const ai = new GoogleGenAI({ apiKey });

  const modelsToTry = [
    ...(options.preferredModel ? [options.preferredModel] : []),
    ...MODEL_FALLBACK_CHAIN.filter((m) => m !== options.preferredModel),
  ];

  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      const config: Record<string, any> = {};
      if (options.systemInstruction) {
        config.systemInstruction = options.systemInstruction;
      }
      if (options.responseMimeType) {
        config.responseMimeType = options.responseMimeType;
      }
      if (options.responseSchema) {
        config.responseSchema = options.responseSchema;
      }
      if (typeof options.temperature === 'number') {
        config.temperature = options.temperature;
      }

      const response = await ai.models.generateContent({
        model,
        contents: options.contents,
        config: Object.keys(config).length > 0 ? config : undefined,
      });

      const text = response.text || '';
      return { text, modelUsed: model };
    } catch (err: any) {
      lastError = err;
      const status = err?.status || err?.statusCode;
      const msg = err?.message || String(err);
      
      console.warn(
        `[Gemini Fallback] Model '${model}' failed with status ${status || 'unknown'}: ${msg}. Attempting next model...`
      );

      // Unrecoverable authorization error -> break early
      if (status === 401 || status === 403 || msg.includes('API_KEY_INVALID')) {
        throw new Error(`Authentication failure with Gemini API: ${msg}`);
      }
    }
  }

  throw new Error(
    `All models in fallback chain failed (${modelsToTry.join(', ')}). Last error: ${
      lastError?.message || 'Unknown generation failure'
    }`
  );
}

export { Type };
