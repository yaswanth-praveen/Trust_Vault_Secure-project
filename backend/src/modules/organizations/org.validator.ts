import { z } from 'zod';

export const createOrgSchema = {
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase alphanumeric characters and hyphens'),
  }),
};

export const updateOrgSchema = {
  body: z.object({
    name: z.string().min(2).optional(),
    status: z.enum(['ACTIVE', 'SUSPENDED']).optional(),
  }),
};
