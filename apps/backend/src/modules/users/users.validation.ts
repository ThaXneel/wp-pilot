import { z } from 'zod';

export const updateProfileSchema = z.object({
  email: z.string().email().optional(),
});

export const updatePreferencesSchema = z.object({
  languagePreference: z.enum(['en', 'fr']).optional(),
  themePreference: z.enum(['system', 'dark', 'light']).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
