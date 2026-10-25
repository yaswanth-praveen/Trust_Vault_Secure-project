import { z } from 'zod';

export const createShareSchema = {
  body: z.object({
    grantedToUserId: z.string().optional(), // null or omitted means org-wide share
    permission: z.enum(['VIEW', 'DOWNLOAD', 'EDIT_METADATA', 'SHARE', 'MANAGE_PERMISSIONS']),
    expiresAt: z.string().datetime().optional(),
  }),
};

export const updateShareSchema = {
  body: z.object({
    permission: z.enum(['VIEW', 'DOWNLOAD', 'EDIT_METADATA', 'SHARE', 'MANAGE_PERMISSIONS']).optional(),
    expiresAt: z.string().datetime().nullable().optional(),
  }),
};
