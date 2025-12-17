import { z } from 'zod';
import { dateRegex } from './constants';

export const logSchema = z.object({
  id: z.coerce.number().int().min(0).optional(),
  quantity: z.coerce.number().int().min(0, 'quantityNegative'),
  date: z.coerce.string().regex(dateRegex, 'invalid'),
  userId: z.coerce.number().int().optional(),
});
