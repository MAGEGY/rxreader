'use server';

/**
 * @fileOverview An AI agent that enhances OCR accuracy for handwritten prescriptions, especially in English and Arabic.
 *
 * - enhanceOcrAccuracy - A function that takes handwritten text and returns enhanced text.
 * - EnhanceOcrAccuracyInput - The input type for the enhanceOcrAccuracy function.
 * - EnhanceOcrAccuracyOutput - The return type for the enhanceOcrAccuracy function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EnhanceOcrAccuracyInputSchema = z.object({
  handwrittenText: z
    .string()
    .describe('The handwritten text extracted from the prescription.'),
});
export type EnhanceOcrAccuracyInput = z.infer<typeof EnhanceOcrAccuracyInputSchema>;

const EnhanceOcrAccuracyOutputSchema = z.object({
  enhancedText: z
    .string()
    .describe('The enhanced and corrected text, with improved accuracy.'),
});
export type EnhanceOcrAccuracyOutput = z.infer<typeof EnhanceOcrAccuracyOutputSchema>;

export async function enhanceOcrAccuracy(input: EnhanceOcrAccuracyInput): Promise<EnhanceOcrAccuracyOutput> {
  return enhanceOcrAccuracyFlow(input);
}

const enhanceOcrAccuracyPrompt = ai.definePrompt({
  name: 'enhanceOcrAccuracyPrompt',
  input: {schema: EnhanceOcrAccuracyInputSchema},
  output: {schema: EnhanceOcrAccuracyOutputSchema},
  prompt: `You are an AI assistant specializing in enhancing the accuracy of OCR-extracted text from handwritten prescriptions, which may be in English, Arabic, or a mix of both.

You will receive raw OCR output. Your goal is to auto-detect the language(s), correct any errors, clarify ambiguities, and ensure that the text is as accurate as possible for downstream tasks like medication identification.

OCR Output: {{{handwrittenText}}}

Enhanced Text:`,
});

const enhanceOcrAccuracyFlow = ai.defineFlow(
  {
    name: 'enhanceOcrAccuracyFlow',
    inputSchema: EnhanceOcrAccuracyInputSchema,
    outputSchema: EnhanceOcrAccuracyOutputSchema,
  },
  async input => {
    const {output} = await enhanceOcrAccuracyPrompt(input);
    return output!;
  }
);
