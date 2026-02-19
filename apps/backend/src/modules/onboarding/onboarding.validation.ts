import { z } from 'zod';

export const verifyHandshakeSchema = z.object({
  token: z.string().min(1),
  wpUrl: z.string().url(),
  wpVersion: z.string().optional(),
});

export type VerifyHandshakeInput = z.infer<typeof verifyHandshakeSchema>;
