import Groq from 'groq-sdk';
import { logger } from '../lib/logger.js';

const apiKey = process.env['GROQ_API_KEY'];

export const groq = new Groq({ apiKey: apiKey ?? '' });

export async function callGroq(
  userPrompt: string,
  systemPrompt: string,
  maxTokens: number = 256,
  temperature: number = 0.3,
): Promise<string | null> {
  const start = Date.now();
  try {
    const completion = await groq.chat.completions.create({
      model: 'llama3-8b-8192',
      temperature,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });

    const latencyMs = Date.now() - start;
    const usage = completion.usage;
    logger.info(
      { latencyMs, promptTokens: usage?.prompt_tokens, completionTokens: usage?.completion_tokens },
      'Groq API call completed',
    );

    return completion.choices[0]?.message?.content ?? null;
  } catch (err: unknown) {
    const latencyMs = Date.now() - start;
    logger.warn({ latencyMs, err }, 'Groq API call failed');
    return null;
  }
}
