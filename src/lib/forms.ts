import { z } from 'zod';

export const logSchema = z.object({
  id: z.coerce.number().int().min(0).optional(),
  quantity: z.coerce.number().int().min(0, 'quantityNegative'),
  date: z.coerce.date('invalid'),
  userId: z.coerce.number().int(),
});
