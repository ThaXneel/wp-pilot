import { prisma } from '../../config/database.js';
import { AppError } from '../../middleware/errorHandler.js';
import bcrypt from 'bcryptjs';
import type { UpdateProfileInput, UpdatePreferencesInput, ChangePasswordInput } from './users.validation.js';

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

  async changePassword(userId: string, input: ChangePasswordInput) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const validPassword = await bcrypt.compare(input.currentPassword, user.passwordHash);
    if (!validPassword) {
      throw new AppError('Current password is incorrect', 401);
    }

    const hashedPassword = await bcrypt.hash(input.newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword },
    });

    return { message: 'Password changed successfully' };
  },
};
