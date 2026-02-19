import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../../config/database.js';
import { env } from '../../config/env.js';
import { resend } from '../../config/resend.js';
import { logger } from '../../config/logger.js';
import { AppError } from '../../middleware/errorHandler.js';
import type { RegisterInput, LoginInput, ResetPasswordInput, ConfirmResetInput } from './auth.validation.js';

function generateAccessToken(payload: { id: string; role: string; clientId?: string }): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '15m' });
}

function generateRefreshToken(payload: { id: string }): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
}

export const authService = {
  async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw new AppError('Email already registered', 409);
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        role: 'CLIENT',
        client: {
          create: {
            plan: 'STARTER',
            status: 'PENDING',
          },
        },
      },
      include: { client: true },
    });

    const tokenPayload = { id: user.id, role: user.role, clientId: user.client?.id };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken({ id: user.id });

    logger.info(`User registered: ${user.email}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        languagePreference: user.languagePreference,
        themePreference: user.themePreference,
      },
      accessToken,
      refreshToken,
    };
  },

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      include: { client: true },
    });

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    const isValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValid) {
      throw new AppError('Invalid email or password', 401);
    }

    const tokenPayload = { id: user.id, role: user.role, clientId: user.client?.id };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken({ id: user.id });

    logger.info(`User logged in: ${user.email}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        languagePreference: user.languagePreference,
        themePreference: user.themePreference,
      },
      accessToken,
      refreshToken,
    };
  },

  async refresh(refreshTokenStr: string) {
    try {
      const payload = jwt.verify(refreshTokenStr, env.JWT_REFRESH_SECRET) as { id: string };

      const user = await prisma.user.findUnique({
        where: { id: payload.id },
        include: { client: true },
      });

      if (!user) {
        throw new AppError('User not found', 401);
      }

      const tokenPayload = { id: user.id, role: user.role, clientId: user.client?.id };
      const accessToken = generateAccessToken(tokenPayload);
      const newRefreshToken = generateRefreshToken({ id: user.id });

      return { accessToken, refreshToken: newRefreshToken };
    } catch {
      throw new AppError('Invalid refresh token', 401);
    }
  },

  async resetPassword(input: ResetPasswordInput) {
    const user = await prisma.user.findUnique({ where: { email: input.email } });

    // Always return success to prevent email enumeration
    if (!user) {
      return { message: 'If the email exists, a reset link has been sent.' };
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // Send email via Resend
    if (resend) {
      try {
        await resend.emails.send({
          from: 'WP Pilot <noreply@wppilot.com>',
          to: user.email,
          subject: 'Reset your password',
          html: `
            <h2>Password Reset</h2>
            <p>Click the link below to reset your password. This link expires in 1 hour.</p>
            <a href="${env.FRONTEND_URL}/reset-password?token=${token}">Reset Password</a>
            <p>If you did not request this, please ignore this email.</p>
          `,
        });
      } catch (err) {
        logger.error('Failed to send reset email', { error: (err as Error).message });
      }
    } else {
      logger.warn('Resend not configured — reset token (dev only):', { token });
    }

    return { message: 'If the email exists, a reset link has been sent.' };
  },

  async confirmReset(input: ConfirmResetInput) {
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token: input.token },
    });

    if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
    ]);

    logger.info(`Password reset completed for user ${resetToken.userId}`);

    return { message: 'Password has been reset successfully.' };
  },
};
