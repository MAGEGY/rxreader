'use server';

import { z } from 'zod';
import { performOcr } from '@/ai/flows/perform-ocr';
import { enhanceOcrAccuracy } from '@/ai/flows/enhance-ocr-accuracy';
import { extractMedicationDetails } from '@/ai/flows/extract-medication-details';
import { verifyMedicationAccuracy } from '@/ai/flows/verify-medication-accuracy';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const FormSchema = z.object({
  prescriptionImage: z
    .instanceof(File)
    .refine((file) => file.size > 0, 'Please select an image.')
    .refine(
      (file) => file.size <= MAX_FILE_SIZE,
      `Max file size is 5MB.`,
    )
    .refine(
      (file) => ACCEPTED_IMAGE_TYPES.includes(file.type),
      ".jpg, .jpeg, .png and .webp files are accepted.",
    ),
  verificationSource: z.enum(['local', 'internet']).default('local'),
  targetLanguage: z.enum(['en', 'ar']).default('en'),
});

export type AnalysisResult = {
  medication: {
    name: string;
    dosage: string;
    uses: string;
  };
  verification: {
    isAccurate: boolean;
    confidenceLevel: string;
    details?: string;
    drugInteractions?: string;
    recommendations?: string;
  };
};

export type State = {
  error?: string | null;
  results?: AnalysisResult[] | null;
};

async function fileToDataURI(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const dataURI = `data:${file.type};base64,${buffer.toString('base64')}`;
  return dataURI;
}


export async function analyzePrescription(
  prevState: State,
  formData: FormData,
): Promise<State> {
  // Handle reset case
  if (formData.get('reset')) {
    return { error: null, results: null };
  }
  
  const validatedFields = FormSchema.safeParse({
    prescriptionImage: formData.get('prescriptionImage'),
    verificationSource: formData.get('verificationSource'),
    targetLanguage: formData.get('targetLanguage'),
  });

  if (!validatedFields.success) {
    const errors = validatedFields.error.flatten().fieldErrors;
    return {
      error: errors.prescriptionImage?.[0] || errors.verificationSource?.[0] || 'Invalid input.',
    };
  }

  const { prescriptionImage, verificationSource, targetLanguage } = validatedFields.data;

  try {
    // Step 1: Perform OCR
    let ocrResult;
    try {
        const imageDataUri = await fileToDataURI(prescriptionImage);
        ocrResult = await performOcr({ photoDataUri: imageDataUri });
        if (!ocrResult.extractedText) {
            return { error: 'OCR failed: Could not extract text from the image. Please try a clearer image.' };
        }
    } catch (e: any) {
        console.error("OCR error:", e);
        return { error: `OCR analysis failed: ${e.message}` };
    }

    // Step 2: Enhance OCR text
    let enhancedOcr;
    try {
        enhancedOcr = await enhanceOcrAccuracy({
            handwrittenText: ocrResult.extractedText,
        });
    } catch (e: any) {
        console.error("Enhance OCR error:", e);
        return { error: `Failed to enhance OCR text: ${e.message}` };
    }

    // Step 3: Extract medication details
    let medications;
    try {
        medications = await extractMedicationDetails({
            prescriptionText: enhancedOcr.enhancedText,
            targetLanguage: targetLanguage,
        });
        if (!medications || medications.length === 0) {
            return { error: 'Could not identify any medications from the text. Please try with a clearer prescription image.' };
        }
    } catch (e: any) {
        console.error("Extract Medication error:", e);
        return { error: `Failed to extract medication details: ${e.message}` };
    }

    // Step 4: Verify each medication
    const analysisResults = await Promise.all(
      medications.map(async (med) => {
        let verification;
        try {
            verification = await verifyMedicationAccuracy({
                medicationName: med.name,
                dosage: med.dosage,
                uses: med.uses,
                verificationSource: verificationSource,
                targetLanguage: targetLanguage,
            });
        } catch (e: any) {
            console.error(`Verification error for ${med.name}:`, e);
            throw new Error(`Verification failed for ${med.name}: ${e.message}`);
        }

        return {
          medication: med,
          verification: verification.verificationResult,
        };
      })
    );
    
    return { results: analysisResults };

  } catch (e: any) {
    console.error("An unexpected error occurred during analysis:", e);
    return { error: `An unexpected error occurred: ${e.message}` };
  }
}
