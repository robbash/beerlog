'use server';

import { prisma } from '@/lib/server/prisma';
import { sendEmail } from '@/lib/server/email';
import { hash } from 'bcryptjs';
import crypto from 'crypto';
import { passwordPatterns } from '@/lib/password.schema';

const resetTokenExpiryHours = 24;

export async function requestPasswordReset(email: string) {
  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return { success: true };
    }

    // Generate secure random token
    const token = crypto.randomBytes(32).toString('hex');

    // Calculate expiry time
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + resetTokenExpiryHours);

    // Store token in database
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    const resetLink = `${process.env.APP_BASE_URL}/reset-password?token=${token}`;

    const emailText = `Hello ${user.firstName},\n\nYou have requested to reset your password for your BeerLog account.\n\nPlease click the following link to reset your password:
${resetLink}\n\nThis link will expire in ${resetTokenExpiryHours} hours.\n\n If you did not request this password reset, please ignore this email.`;

    await sendEmail(user.email, 'Password Reset Request', emailText);

    return { success: true };
  } catch (error) {
    console.error('Password reset request error:', error);
    return { success: false, error: 'Failed to send password reset email' };
  }
}

export async function resetPassword(token: string, newPassword: string) {
  try {
    // Validate password
    const validation = passwordPatterns.safeParse(newPassword);
    if (!validation.success) {
      return { success: false, error: 'Password does not meet requirements' };
    }

    // Find valid token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      return { success: false, error: 'Invalid or expired reset token' };
    }

    // Check if token is expired
    if (resetToken.expiresAt < new Date()) {
      return { success: false, error: 'Reset token has expired' };
    }

    // Check if token is already used
    if (resetToken.used) {
      return { success: false, error: 'Reset token has already been used' };
    }

    // Hash new password
    const passwordHash = await hash(newPassword, 10);

    // Update password and mark token as used
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

    return { success: true };
  } catch (error) {
    console.error('Password reset error:', error);
    return { success: false, error: 'Failed to reset password' };
  }
}

export async function verifyResetToken(token: string) {
  try {
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return { valid: false, error: 'Invalid reset token' };
    }

    if (resetToken.expiresAt < new Date()) {
      return { valid: false, error: 'Reset token has expired' };
    }

    if (resetToken.used) {
      return { valid: false, error: 'Reset token has already been used' };
    }

    return { valid: true };
  } catch (error) {
    console.error('Token verification error:', error);
    return { valid: false, error: 'Failed to verify token' };
  }
}
