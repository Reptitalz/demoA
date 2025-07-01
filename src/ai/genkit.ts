
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
  // NOTE: Intentionally not throwing an error here to prevent the entire server from crashing on startup.
  // Genkit will fail with a more specific error when an AI function is actually called.
}

export const ai = genkit({
  plugins: [googleAI({ apiKey: GOOGLE_API_KEY_ENV })], // Pass the key explicitly, even if undefined
  model: 'googleai/gemini-2.0-flash',
});
