'use server';

/**
 * @fileOverview Performs OCR on a prescription image to extract text.
 *
 * - performOcr - A function that takes an image data URI and returns the extracted text.
 * - PerformOcrInput - The input type for the performOcr function.
 * - PerformOcrOutput - The return type for the performOcr function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PerformOcrInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a prescription, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type PerformOcrInput = z.infer<typeof PerformOcrInputSchema>;

const PerformOcrOutputSchema = z.object({
  extractedText: z.string().describe('The text extracted from the prescription image.'),
});
export type PerformOcrOutput = z.infer<typeof PerformOcrOutputSchema>;

export async function performOcr(input: PerformOcrInput): Promise<PerformOcrOutput> {
  return performOcrFlow(input);
}

const performOcrPrompt = ai.definePrompt({
  name: 'performOcrPrompt',
  input: {schema: PerformOcrInputSchema},
  output: {schema: PerformOcrOutputSchema},
  prompt: `You are an OCR (Optical Character Recognition) service. Extract all text from the following image.

Photo: {{media url=photoDataUri}}`,
});

const performOcrFlow = ai.defineFlow(
  {
    name: 'performOcrFlow',
    inputSchema: PerformOcrInputSchema,
    outputSchema: PerformOcrOutputSchema,
  },
  async input => {
    const {output} = await performOcrPrompt(input);
    return output!;
  }
);
