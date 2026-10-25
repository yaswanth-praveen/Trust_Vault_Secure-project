import { z } from 'zod';

export const loginSchema = {
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    organizationId: z.string().optional(),
    rememberMe: z.boolean().optional(),
  }),
};

export const forgotPasswordSchema = {
  body: z.object({
    email: z.string().email('Invalid email address'),
  }),
};

export const resetPasswordSchema = {
  body: z.object({
    token: z.string().min(1, 'Token is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
  }),
};

export const switchOrgSchema = {
  body: z.object({
    organizationId: z.string().min(1, 'organizationId is required'),
  }),
};
