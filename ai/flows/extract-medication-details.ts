'use server';

/**
 * @fileOverview Extracts medication details (name, dosage, uses) from prescription text using AI.
 *
 * - extractMedicationDetails - Function to extract medication details from text.
 * - ExtractMedicationDetailsInput - Input type for extractMedicationDetails function.
 * - ExtractMedicationDetailsOutput - Output type for extractMedicationDetails function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractMedicationDetailsInputSchema = z.object({
  prescriptionText: z
    .string()
    .describe('The text extracted from the prescription image, which could be in English, Arabic, or both.'),
  targetLanguage: z.enum(['en', 'ar']).default('en').describe('The target language for the output.'),
});
export type ExtractMedicationDetailsInput = z.infer<
  typeof ExtractMedicationDetailsInputSchema
>;

const MedicationDetailsSchema = z.object({
  name: z.string().describe('The name of the medication.'),
  dosage: z.string().describe('The dosage of the medication.'),
  uses: z.string().describe('The uses of the medication, translated into the target language.'),
});

const ExtractMedicationDetailsOutputSchema = z.array(
  MedicationDetailsSchema
);
export type ExtractMedicationDetailsOutput = z.infer<
  typeof ExtractMedicationDetailsOutputSchema
>;

export async function extractMedicationDetails(
  input: ExtractMedicationDetailsInput
): Promise<ExtractMedicationDetailsOutput> {
  return extractMedicationDetailsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractMedicationDetailsPrompt',
  input: {schema: ExtractMedicationDetailsInputSchema},
  output: {schema: ExtractMedicationDetailsOutputSchema},
  prompt: `You are a pharmacist extracting medication details from a prescription. The text may be in English, Arabic, or a mix of both.

  Extract the medicine name, dosage, and its uses, from the text.

  The final output for 'uses' must be translated into the specified target language: {{{targetLanguage}}}.

  Text: {{{prescriptionText}}}

  Return the details as a JSON array.
  `,
});

const extractMedicationDetailsFlow = ai.defineFlow(
  {
    name: 'extractMedicationDetailsFlow',
    inputSchema: ExtractMedicationDetailsInputSchema,
    outputSchema: ExtractMedicationDetailsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
