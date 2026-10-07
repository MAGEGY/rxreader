import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

// Use a placeholder when GOOGLE_API_KEY is not set so the production build
// succeeds without secrets; AI calls will fail gracefully until a real key
// is configured in the hosting environment.
export const ai = genkit({
  plugins: [googleAI({ apiKey: process.env.GOOGLE_API_KEY || 'build-placeholder' })],
  model: 'googleai/gemini-2.5-flash',
});
