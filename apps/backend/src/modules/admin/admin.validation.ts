import { z } from 'zod';

export const createClientSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  plan: z.enum(['STARTER', 'GROWTH', 'ELITE']).default('STARTER'),
});

export const updateClientStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'PENDING']),
});

export const updateEmailSettingsSchema = z.object({
  fromEmail: z.string().email('Invalid email address'),
  fromName: z.string().min(1, 'From name is required').max(100),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientStatusInput = z.infer<typeof updateClientStatusSchema>;
export type UpdateEmailSettingsInput = z.infer<typeof updateEmailSettingsSchema>;
