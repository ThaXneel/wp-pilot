import { prisma } from '../../config/database.js';
import { AppError } from '../../middleware/errorHandler.js';
import type { UpdateProfileInput, UpdatePreferencesInput } from './users.validation.js';

export const usersService = {
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        languagePreference: true,
        themePreference: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  },

  async updateProfile(userId: string, input: UpdateProfileInput) {
    if (input.email) {
      const existing = await prisma.user.findUnique({ where: { email: input.email } });
      if (existing && existing.id !== userId) {
        throw new AppError('Email already in use', 409);
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: input,
      select: {
        id: true,
        email: true,
        role: true,
        languagePreference: true,
        themePreference: true,
        createdAt: true,
      },
    });

    return user;
  },

  async updatePreferences(userId: string, input: UpdatePreferencesInput) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: input,
      select: {
        id: true,
        languagePreference: true,
        themePreference: true,
      },
    });

    return user;
  },
};
