import { z } from 'zod';

export const createClientSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  plan: z.enum(['STARTER', 'GROWTH', 'ELITE']).default('STARTER'),
});

export const updateClientStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'PENDING']),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientStatusInput = z.infer<typeof updateClientStatusSchema>;
