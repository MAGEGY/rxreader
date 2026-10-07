'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useLanguage } from '@/context/language-provider';
import { useState, useEffect } from 'react';

export function SettingsDialog({ children }: { children: React.ReactNode }) {
  const { t, language, setLanguage } = useLanguage();

  const [verificationSource, setVerificationSource] = useState('local');
  const [expandMedicalInfo, setExpandMedicalInfo] = useState(true);
  const [showInteractions, setShowInteractions] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const storedSource = localStorage.getItem('verificationSource') || 'local';
      setVerificationSource(storedSource);

      const storedExpand = localStorage.getItem('expandMedicalInfo');
      setExpandMedicalInfo(storedExpand !== 'false');

      const storedInteractions = localStorage.getItem('showInteractions');
      setShowInteractions(storedInteractions !== 'false');
    }
  }, [isOpen]);

  const handleSave = () => {
    localStorage.setItem('verificationSource', verificationSource);
    localStorage.setItem('expandMedicalInfo', String(expandMedicalInfo));
    localStorage.setItem('showInteractions', String(showInteractions));
    // Language is saved automatically by the useLanguage hook
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('settings.title')}</DialogTitle>
          <DialogDescription>{t('settings.display.description')}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid gap-3">
            <Label>{t('settings.verification.title')}</Label>
            <RadioGroup
              value={verificationSource}
              onValueChange={setVerificationSource}
              className="grid grid-cols-1 gap-4"
            >
              <div>
                <RadioGroupItem value="local" id="local" className="peer sr-only" />
                <Label
                  htmlFor="local"
                  className="flex flex-col items-start rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <span className="font-semibold">{t('settings.verification.local.title')}</span>
                  <span className="text-sm text-muted-foreground">
                    {t('settings.verification.local.description')}
                  </span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="internet" id="internet" className="peer sr-only" />
                <Label
                  htmlFor="internet"
                  className="flex flex-col items-start rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <span className="font-semibold">{t('settings.verification.internet.title')}</span>
                  <span className="text-sm text-muted-foreground">
                    {t('settings.verification.internet.description')}
                  </span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid gap-3">
            <Label>{t('settings.display.language')}</Label>
            <RadioGroup
              value={language}
              onValueChange={(val) => setLanguage(val as 'en' | 'ar')}
              className="grid grid-cols-2 gap-4"
            >
              <div>
                <RadioGroupItem value="en" id="en" className="peer sr-only" />
                <Label
                  htmlFor="en"
                  className="flex h-full flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  {t('language.en')}
                </Label>
              </div>
              <div>
                <RadioGroupItem value="ar" id="ar" className="peer sr-only" />
                <Label
                  htmlFor="ar"
                  className="flex h-full flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  {t('language.ar')}
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid gap-3">
            <Label>{t('settings.features.title')}</Label>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="expand-info" className="text-base">
                  {t('settings.features.expandInfo')}
                </Label>
              </div>
              <Switch id="expand-info" checked={expandMedicalInfo} onCheckedChange={setExpandMedicalInfo} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="show-interactions" className="text-base">
                  {t('settings.features.interactions')}
                </Label>
              </div>
              <Switch id="show-interactions" checked={showInteractions} onCheckedChange={setShowInteractions} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>{t('settings.done')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
