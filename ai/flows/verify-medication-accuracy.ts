'use server';

/**
 * @fileOverview Verifies the accuracy of medication information against a selected source (local CSV or internet), checks for drug interactions, and provides patient recommendations.
 *
 * - verifyMedicationAccuracy - A function that verifies medication accuracy and provides additional details.
 * - VerifyMedicationAccuracyInput - The input type for the verifyMedicationAccuracy function.
 * - VerifyMedicationAccuracyOutput - The return type for the verifyMedicationAccuracy function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import * as fs from 'fs';
import * as path from 'path';

// Define a simple in-memory cache
let csvDataCache: any[] | null = null;

const VerifyMedicationAccuracyInputSchema = z.object({
  medicationName: z.string().describe('The name of the medication to verify.'),
  dosage: z.string().optional().describe('The dosage of the medication, if available.'),
  uses: z.string().optional().describe('The uses of the medication, if available.'),
  verificationSource: z.enum(['local', 'internet']).default('local').describe('The source to use for verification.'),
  targetLanguage: z.enum(['en', 'ar']).default('en').describe('The target language for the output.'),
});

export type VerifyMedicationAccuracyInput = z.infer<typeof VerifyMedicationAccuracyInputSchema>;

const VerificationResultSchema = z.object({
  isAccurate: z.boolean().describe('Whether the medication information is accurate based on the selected source.'),
  confidenceLevel: z
    .string()
    .describe('A description of the level of confidence in the accuracy of the medication information.'),
  details: z.string().optional().describe('Any additional details or discrepancies found during verification.'),
  drugInteractions: z.string().optional().describe('Potential drug interactions with this medication, translated to the target language.'),
  recommendations: z.string().optional().describe('Recommendations for the patient regarding this medication, translated to the target language.'),
});

const VerifyMedicationAccuracyOutputSchema = z.object({
  verificationResult: VerificationResultSchema.describe(
    'The result of verifying the medication accuracy, including interactions and recommendations.'
  ),
});

export type VerifyMedicationAccuracyOutput = z.infer<typeof VerifyMedicationAccuracyOutputSchema>;

export async function verifyMedicationAccuracy(
  input: VerifyMedicationAccuracyInput
): Promise<VerifyMedicationAccuracyOutput> {
  return verifyMedicationAccuracyFlow(input);
}

// Simple CSV parser
function parseCSV(csv: string) {
  const lines = csv.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const data = lines.slice(1).map(line => {
    const values = line.split(',');
    return headers.reduce((obj, header, index) => {
      (obj as any)[header] = values[index] ? values[index].trim().replace(/"/g, '') : '';
      return obj;
    }, {});
  });
  return data;
}

const verifyMedicationFromCSV = ai.defineTool({
  name: 'verifyMedicationFromCSV',
  description: 'Searches for a medication in the local CSV database and returns its information. Use this tool when the verification source is "local".',
  inputSchema: z.object({
    medicationName: z.string().describe('The name of the medication to search for.'),
  }),
  outputSchema: z.string(),
}, async (input) => {
  try {
    if (!csvDataCache) {
      const filePath = path.join(process.cwd(), 'src', 'lib', 'data', 'medication_db.csv');
      const csvFile = fs.readFileSync(filePath, 'utf8');
      csvDataCache = parseCSV(csvFile);
    }
    
    const medication = csvDataCache.find(med => 
        med.medicineName && med.medicineName.toLowerCase() === input.medicationName.toLowerCase()
    );

    if (medication) {
      return `Found in database: ${JSON.stringify(medication)}`;
    } else {
      return `Medication '${input.medicationName}' not found in the local database.`;
    }
  } catch (error) {
    console.error("Error reading or parsing CSV file:", error);
    return "An error occurred while accessing the medication database.";
  }
});

const getSaifPharmacyInfo = ai.defineTool({
    name: 'getSaifPharmacyInfo',
    description: 'Searches for a medication on the Saif Pharmacy website and returns its information. Use this tool when the verification source is "internet".',
    inputSchema: z.object({
      medicationName: z.string().describe('The name of the medication to search for.'),
    }),
    outputSchema: z.string(),
  }, async (input) => {
    // Placeholder for actual web scraping or API call logic
    console.log(`(Placeholder) Searching Saif Pharmacy for: ${input.medicationName}`);
    return `Information for '${input.medicationName}' not found on Saif Pharmacy (placeholder response).`;
});

const getTarshoubyInfo = ai.defineTool({
    name: 'getTarshoubyInfo',
    description: 'Searches for a medication on the Tarshouby website and returns its information. Use this tool when the verification source is "internet".',
    inputSchema: z.object({
        medicationName: z.string().describe('The name of the medication to search for.'),
    }),
    outputSchema: z.string(),
    }, async (input) => {
    // Placeholder for actual web scraping or API call logic
    console.log(`(Placeholder) Searching Tarshouby for: ${input.medicationName}`);
    return `Information for '${input.medicationName}' not found on Tarshouby (placeholder response).`;
});


const verificationPrompt = ai.definePrompt({
  name: 'medicationVerificationPrompt',
  input: {schema: VerifyMedicationAccuracyInputSchema},
  output: {schema: VerifyMedicationAccuracyOutputSchema},
  tools: [verifyMedicationFromCSV, getSaifPharmacyInfo, getTarshoubyInfo],
  prompt: `You are an expert pharmacist responsible for verifying the accuracy of medication information, checking for drug interactions, and providing patient recommendations.

You will be provided with the name, dosage, uses, and a verification source ('local' or 'internet').

Your task is to:
1. Use the appropriate tool(s) based on the 'verificationSource' provided.
   - If 'local', use only the 'verifyMedicationFromCSV' tool.
   - If 'internet', use the 'getSaifPharmacyInfo' and 'getTarshoubyInfo' tools.
2. Based on the tool results, determine if the extracted information seems accurate.
3. **Using your own internal knowledge**, identify potential general drug interactions for the given medication.
4. **Using your own internal knowledge**, provide actionable recommendations for the patient.
5. All textual output fields ('drugInteractions', 'recommendations', 'details') must be in the specified target language: {{{targetLanguage}}}.

Based on your findings, determine if the provided information is accurate and provide a confidence level.

Medication Name: {{{medicationName}}}
Dosage: {{{dosage}}}
Uses: {{{uses}}}
Verification Source: {{{verificationSource}}}
Target Language: {{{targetLanguage}}}

Always call the appropriate tool(s) based on the verification source.

Output a JSON object with the following keys:
{
  "verificationResult": {
    "isAccurate": true if found and info matches, false otherwise,
    "confidenceLevel": "A description of the level of confidence (e.g., 'High - Found in local database').",
    "details": "Details from the source or a message indicating it was not found.",
    "drugInteractions": "A summary of potential drug interactions.",
    "recommendations": "A list of recommendations for the patient."
  }
}
`,
});

const verifyMedicationAccuracyFlow = ai.defineFlow(
  {
    name: 'verifyMedicationAccuracyFlow',
    inputSchema: VerifyMedicationAccuracyInputSchema,
    outputSchema: VerifyMedicationAccuracyOutputSchema,
  },
  async input => {
    const {output} = await verificationPrompt(input);
    return output!;
  }
);
