
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Attempt to get the API key from common environment variable names
const GOOGLE_API_KEY_ENV = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

if (!GOOGLE_API_KEY_ENV && process.env.NODE_ENV !== 'test') {
  const errorMessage =
    'CRITICAL ERROR: GOOGLE_API_KEY (or GEMINI_API_KEY/GOOGLE_GENERATIVE_AI_API_KEY) is not set for the Genkit GoogleAI plugin. ' +
    'AI features will not function. Please set this environment variable in your .env.local file or hosting provider configuration.';
  console.error('**********************************************************************************');
  console.error(errorMessage);
  console.error('**********************************************************************************');

  // For production or CI builds, it's better to fail loudly.
  // For local development, throwing here might be too disruptive if AI isn't the current focus.
  // However, any attempt to use `ai.generate()` would fail later anyway.
  // Let's throw to make the problem immediately obvious.
  throw new Error(errorMessage);
}

export const ai = genkit({
  plugins: [googleAI({ apiKey: GOOGLE_API_KEY_ENV })], // Pass the key explicitly
  model: 'googleai/gemini-2.0-flash',
});
