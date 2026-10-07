import { config } from 'dotenv';
config();

import '@/ai/flows/enhance-ocr-accuracy.ts';
import '@/ai/flows/extract-medication-details.ts';
import '@/ai/flows/verify-medication-accuracy.ts';
import '@/ai/flows/perform-ocr.ts';
