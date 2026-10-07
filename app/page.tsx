'use client';

import { PrescriptionAnalyzer } from '@/components/prescription-analyzer';
import { Pill, Settings } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/context/language-provider';
import { SettingsDialog } from '@/components/settings-dialog';
import { Button } from '@/components/ui/button';

export default function Home() {
  const { t } = useLanguage();
  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Pill className="h-6 w-6 text-primary" />
          <span className="font-headline text-xl">{t('app.name')}</span>
        </Link>
        <SettingsDialog>
          <Button variant="outline" size="icon">
            <Settings className="h-5 w-5" />
            <span className="sr-only">Settings</span>
          </Button>
        </SettingsDialog>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="mx-auto grid w-full max-w-4xl items-start gap-6">
          <div className="grid gap-6">
            <PrescriptionAnalyzer />
          </div>
        </div>
      </main>
    </div>
  );
}
