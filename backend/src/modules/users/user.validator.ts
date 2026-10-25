import { z } from 'zod';

export const inviteUserSchema = {
  body: z.object({
    email: z.string().email('Invalid email address'),
    fullName: z.string().min(2, 'Full name is required'),
    role: z.enum(['ORG_ADMIN', 'DOCUMENT_MANAGER', 'STANDARD_USER', 'AUDITOR']),
  }),
};

export const updateUserRoleSchema = {
  body: z.object({
    role: z.enum(['ORG_ADMIN', 'DOCUMENT_MANAGER', 'STANDARD_USER', 'AUDITOR']),
  }),
};

export const updateUserStatusSchema = {
  body: z.object({
    status: z.enum(['ACTIVE', 'SUSPENDED']),
  }),
};

export const updateUserDetailsSchema = {
  body: z.object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters').optional(),
    email: z.string().email('Invalid email address').optional(),
    role: z.enum(['ORG_ADMIN', 'DOCUMENT_MANAGER', 'STANDARD_USER', 'AUDITOR']).optional(),
    password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
  }),
};

export const acceptInviteSchema = {
  body: z.object({
    token: z.string().min(1, 'Invitation token is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    fullName: z.string().min(2).optional(),
  }),
};
