'use client';

import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircleIcon, LoaderCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { allocatePayments, recordPayment } from '@/app/actions/payment';
import { User } from '@prisma/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

interface Props {
  users: User[];
  selectedUserId?: number;
}

export function PaymentForm(props: Props) {
  const { users, selectedUserId } = props;

  const t = useTranslations('pages.payment');
  const router = useRouter();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData(event.currentTarget);
      const userId = parseInt(formData.get('userId') as string);
      const amountEuros = parseFloat(formData.get('amountEuros') as string);
      const note = formData.get('note') as string;

      const values = {
        userId,
        amountCents: Math.round(amountEuros * 100),
        currency: 'EUR',
        note: note || undefined,
      };

      const paymentResult = await recordPayment(values);

      if (!paymentResult.ok) {
        throw new Error(paymentResult.formError || 'Failed to record payment. Please try again.');
      }

      const allocationResult = await allocatePayments(userId);

      if (!allocationResult.ok) {
        throw new Error(allocationResult.error || 'Failed to record payment. Please try again.');
      }

      setSuccess(t('success'));

      setTimeout(() => {
        router.push('/users');
      }, 1500);
    } catch (error) {
      setError((error as Error).message);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={onSubmit}>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircleIcon />
              <AlertTitle>{t('error.title')}</AlertTitle>
              <AlertDescription>
                <p>{error}</p>
              </AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4 border-green-600 bg-green-50 text-green-800">
              <AlertTitle>{success}</AlertTitle>
            </Alert>
          )}

          <div className="grid gap-6">
            <div className="grid gap-3">
              <Label htmlFor="userId">{t('form.user')}</Label>
              <Select name="userId" defaultValue={String(selectedUserId)} required>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('form.userPlaceholder')} />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {users.map((user) => (
                    <SelectItem key={user.id} value={String(user.id)}>
                      {user.firstName} {user.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-3">
              <Label htmlFor="amountEuros">{t('form.amount')}</Label>
              <Input
                name="amountEuros"
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="10.00"
              />
            </div>

            <div className="grid gap-3">
              <Label htmlFor="note">{t('form.note')}</Label>
              <Input name="note" type="text" placeholder={t('form.notePlaceholder')} />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <LoaderCircle className="animate-spin" />}
              {t('button.submit')}
            </Button>

            <Button
              type="button"
              className="w-full"
              variant="secondary"
              onClick={() => router.push('/users')}
            >
              {t('button.cancel')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
