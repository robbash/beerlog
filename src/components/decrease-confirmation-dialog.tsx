'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';

interface DecreaseConfirmationDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DecreaseConfirmationDialog({
  open,
  onConfirm,
  onCancel,
}: DecreaseConfirmationDialogProps) {
  const t = useTranslations('pages.beerLog.decreaseConfirmation');
  const [step, setStep] = useState(1);

  const handleClose = () => {
    setStep(1);
    onCancel();
  };

  const handleStep1Confirm = () => {
    setStep(2);
  };

  const handleStep2Cancel = () => {
    setStep(3);
  };

  const handleStep2Confirm = () => {
    // "Go Back" actually cancels
    handleClose();
  };

  const handleStep3Cancel = () => {
    // "Yes, Decrease It" actually confirms
    setStep(1);
    onConfirm();
  };

  const handleStep3Confirm = () => {
    // "Actually, Cancel This" actually cancels
    handleClose();
  };

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent>
        {step === 1 && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('step1.title')}</AlertDialogTitle>
              <AlertDialogDescription>{t('step1.description')}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <Button variant="outline" onClick={handleClose}>
                {t('step1.cancel')}
              </Button>
              <Button variant="destructive" onClick={handleStep1Confirm}>
                {t('step1.confirm')}
              </Button>
            </AlertDialogFooter>
          </>
        )}

        {step === 2 && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('step2.title')}</AlertDialogTitle>
              <AlertDialogDescription>{t('step2.description')}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <Button variant="default" onClick={handleStep2Confirm}>
                {t('step2.confirm')}
              </Button>
              <Button variant="outline" onClick={handleStep2Cancel}>
                {t('step2.cancel')}
              </Button>
            </AlertDialogFooter>
          </>
        )}

        {step === 3 && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-red-600">{t('step3.title')}</AlertDialogTitle>
              <AlertDialogDescription className="text-base">
                {t('step3.description')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <Button variant="secondary" onClick={handleStep3Cancel}>
                {t('step3.cancel')}
              </Button>
              <Button variant="default" onClick={handleStep3Confirm}>
                {t('step3.confirm')}
              </Button>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
