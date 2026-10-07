'use client';

import { useActionState, useState, useEffect, useRef, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import { analyzePrescription, type State, type AnalysisResult } from '@/app/actions';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Upload, Pill, CheckCircle2, XCircle, Info, Loader2, RefreshCw, ArrowRight, AlertTriangle, Lightbulb } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useLanguage } from '@/context/language-provider';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';


const initialState: State = {
  error: null,
  results: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  const { t } = useLanguage();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {t('analyze.button.analyzing')}
        </>
      ) : (
        t('analyze.button.analyze')
      )}
    </Button>
  );
}

function ResultsSkeleton() {
  const { t } = useLanguage();
  return (
    <div className="grid gap-6">
      <h2 className="text-xl font-semibold tracking-tight">{t('analyze.button.analyzing')}</h2>
      {[1, 2].map((i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader>
            <Skeleton className="h-6 w-48 rounded-md" />
            <Skeleton className="h-4 w-32 rounded-md" />
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20 rounded-md" />
              <Skeleton className="h-4 w-full rounded-md" />
            </div>
            <Separator />
            <div className="space-y-2">
              <Skeleton className="h-5 w-24 rounded-md" />
              <Skeleton className="h-8 w-36 rounded-lg" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function MedicationCard({ result, id, expand, showInteractions }: { result: AnalysisResult, id: string, expand: boolean, showInteractions: boolean }) {
  const { medication, verification } = result;
  const { t } = useLanguage();
  
  return (
    <Accordion type="multiple" defaultValue={expand ? [id] : []} className="w-full">
        <AccordionItem value={id} className="border-b-0">
             <Card className="overflow-hidden">
                <AccordionTrigger className="w-full p-0 hover:no-underline">
                    <CardHeader className="flex flex-row items-start justify-between w-full p-6 text-left">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-xl font-headline">
                            <Pill className="h-5 w-5 text-primary" />
                            {medication.name}
                            </CardTitle>
                            <CardDescription>{medication.dosage}</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={verification.isAccurate ? 'default' : 'destructive'} className="whitespace-nowrap bg-primary">
                              {verification.isAccurate ? 'Verified' : 'Unverified'}
                          </Badge>
                          <div className="p-2 rounded-md [&[data-state=open]>svg]:rotate-180">
                            <Info className="h-4 w-4 shrink-0 transition-transform duration-200" />
                          </div>
                        </div>
                    </CardHeader>
                </AccordionTrigger>
                <AccordionContent>
                  <CardContent className="space-y-6 pt-0">
                      <div>
                          <h3 className="font-semibold text-sm">Uses</h3>
                          <p className="text-muted-foreground text-sm">{medication.uses}</p>
                      </div>

                      {showInteractions && verification.drugInteractions && (
                          <Alert variant="destructive">
                              <AlertTriangle className="h-4 w-4" />
                              <AlertTitle>Potential Drug Interactions</AlertTitle>
                              <AlertDescription>
                                  {verification.drugInteractions}
                              </AlertDescription>
                          </Alert>
                      )}

                      {verification.recommendations && (
                          <Alert>
                              <Lightbulb className="h-4 w-4" />
                              <AlertTitle>Patient Recommendations</AlertTitle>
                              <AlertDescription>
                                  {verification.recommendations}
                              </AlertDescription>
                          </Alert>
                      )}
                  </CardContent>
                </AccordionContent>
            </Card>
        </AccordionItem>
    </Accordion>
  );
}

export function PrescriptionAnalyzer() {
  const [state, formAction] = useActionState(analyzePrescription, initialState);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const resultsRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  
  const [verificationSource, setVerificationSource] = useState('local');
  const [expandMedicalInfo, setExpandMedicalInfo] = useState(true);
  const [showInteractions, setShowInteractions] = useState(true);

  const { t, language } = useLanguage();

  useEffect(() => {
    // This effect runs on mount and whenever the component re-renders.
    // It's a good place to sync with localStorage.
    if (typeof window !== 'undefined') {
        const storedSource = localStorage.getItem('verificationSource') || 'local';
        setVerificationSource(storedSource);
        const storedExpand = localStorage.getItem('expandMedicalInfo');
        setExpandMedicalInfo(storedExpand !== 'false');
        const storedInteractions = localStorage.getItem('showInteractions');
        setShowInteractions(storedInteractions !== 'false');
    }
  }, [state]); // Re-sync settings when analysis state changes, e.g., after a reset

  useEffect(() => {
    if (state?.error) {
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: state.error,
      });
    }
  }, [state?.error, toast]);

  useEffect(() => {
    if (state?.results) {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [state?.results]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleReset = () => {
    startTransition(() => {
      formRef.current?.reset();
      setPreview(null);
      const dummyFormData = new FormData();
      dummyFormData.set('reset', 'true');
      formAction(dummyFormData);
    });
  };
  
  const { pending } = useFormStatus();

  return (
    <div className="grid gap-6">
      {!state.results && !pending &&(
          <form action={formAction} ref={formRef}>
            <input type="hidden" name="verificationSource" value={verificationSource} />
            <input type="hidden" name="targetLanguage" value={language} />
            <Card className="transition-all duration-300">
              <CardHeader>
                <CardTitle>{t('analyze.title')}</CardTitle>
                <CardDescription>
                  {t('analyze.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-2">
                  <Label htmlFor="prescriptionImage">{t('analyze.upload.label')}</Label>
                  <Input
                    id="prescriptionImage"
                    name="prescriptionImage"
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                    required
                  />
                  <div
                    className={cn(
                      "flex cursor-pointer flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-muted-foreground/50 p-12 text-center hover:border-primary hover:bg-accent",
                      preview && "p-4"
                    )}
                    onClick={handleUploadClick}
                  >
                    {preview ? (
                      <div className="relative w-full max-w-sm">
                        <Image
                          src={preview}
                          alt="Prescription preview"
                          width={400}
                          height={400}
                          className="rounded-md object-contain"
                        />
                      </div>
                    ) : (
                      <>
                        <div className="rounded-full border bg-background p-3 shadow-sm">
                          <Upload className="h-8 w-8 text-primary" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-xl font-semibold">{t('analyze.upload.cta')}</h3>
                          <p className="text-sm text-muted-foreground">
                            {t('analyze.upload.cta.description.signedIn')}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <SubmitButton />
              </CardFooter>
            </Card>
          </form>
      )}


      <div ref={resultsRef} className="mt-6">
        {pending && (
            <ResultsSkeleton />
        )}
        {state.error && (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-destructive p-12 text-center">
                <AlertTriangle className="h-12 w-12 text-destructive" />
                <h3 className="mt-4 text-lg font-semibold">Analysis Failed</h3>
                <p className="mt-2 text-sm text-muted-foreground">{state.error}</p>
                 <Button variant="outline" onClick={handleReset} className="mt-4">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
            </div>
        )}
        
        {state?.results && (
          <div className="grid gap-4 animate-in fade-in-50 duration-500">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold tracking-tight">Analysis Complete</h2>
                <Button variant="outline" onClick={handleReset}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Scan Another
                </Button>
            </div>
            {state.results.map((result, index) => (
              <MedicationCard key={index} id={`med-${index}`} result={result} expand={expandMedicalInfo} showInteractions={showInteractions}/>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
