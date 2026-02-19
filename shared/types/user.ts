export type Role = 'OWNER' | 'CLIENT';
export type Language = 'en' | 'fr';
export type Theme = 'system' | 'dark' | 'light';

export interface UserProfile {
  id: string;
  email: string;
  role: Role;
  languagePreference: Language;
  themePreference: Theme;
  createdAt: string;
}
