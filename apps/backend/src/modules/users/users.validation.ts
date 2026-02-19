import { z } from 'zod';

export const updateProfileSchema = z.object({
  email: z.string().email().optional(),
});

export const updatePreferencesSchema = z.object({
  languagePreference: z.enum(['en', 'fr']).optional(),
  themePreference: z.enum(['system', 'dark', 'light']).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
