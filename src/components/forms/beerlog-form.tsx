'use client';

import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircleIcon, LoaderCircle, Minus, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { saveLog } from '@/app/actions/log';
import { User } from '@prisma/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import DatePicker from '../date-picker';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

interface Props {
  id?: number;
  date?: Date;
  quantity?: number;
  userId?: number;
  users?: User[];
}

export function BeerLogForm(props: Props) {
  const { id, date, quantity = 1, userId, users } = props;
  const isNew = id === undefined;

  const t = useTranslations('pages.beerLog');
  const router = useRouter();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [formDate, setFormDate] = useState<Date | undefined>(date);
  const [formQuantity, setFormQuantity] = useState<number>(quantity);

  function increaseQuantity(add: number = 1) {
    const newValue = Math.max(1, formQuantity + add);

    setFormQuantity(newValue);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsLoading(true);
    setError(null);

    try {
      const formData = Object.fromEntries(new FormData(event.currentTarget).entries());
      const values = {
        ...formData,
        date: formDate,
      };

      const result = await saveLog(values);

      if (!result.ok) {
        throw new Error('Failed to submit the data. Please try again.');
      }

      router.push('/');
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
        <CardTitle className="text-xl">{t(`title.${isNew ? 'add' : 'edit'}`)}</CardTitle>

        <CardDescription>{t(`description.${isNew ? 'add' : 'edit'}`)}</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={onSubmit}>
          {error && (
            <Alert variant="destructive">
              <AlertCircleIcon />
              <AlertTitle>{t('error.title')}</AlertTitle>
              <AlertDescription>
                <p>{error}</p>
              </AlertDescription>
            </Alert>
          )}

          <Input name="id" type="hidden" value={id} />

          <div className="grid gap-6">
            <div className="grid gap-3">
              <Label htmlFor="date">{t('form.date')}</Label>
              <DatePicker defaultValue={date || new Date()} onSelect={setFormDate} />
            </div>

            <div className="grid gap-3">
              <Label htmlFor="quantity">{t('form.quantity')}</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="default"
                  className="flex-1"
                  onClick={() => increaseQuantity()}
                >
                  <Plus />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-none"
                  onClick={() => increaseQuantity(-1)}
                >
                  <Minus />
                </Button>
              </div>

              <Input
                name="quantity"
                type="number"
                value={formQuantity}
                required
                className="text-center"
              />
            </div>

            {users && (
              <div className="grid gap-3">
                <Label htmlFor="userId">{t('form.userId')}</Label>
                <Select name="userId" defaultValue={String(userId)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('form.userIdPlaceholder')} />
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
            )}

            <Button type="submit" className="w-full">
              {isLoading && <LoaderCircle className="animate-spin" />}
              {t('button.submit')}
            </Button>

            <Button
              type="button"
              className="w-full"
              variant="secondary"
              onClick={() => router.push('/')}
            >
              {t('button.cancel')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
