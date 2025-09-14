import * as React from 'react';
import { cn } from '@/lib/utils';

export function Label({ className, ...p }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn('text-sm font-medium text-gray-700', className)} {...p} />;
}
