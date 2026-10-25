import { z } from 'zod';

export const uploadDocumentSchema = {
  body: z.object({
    title: z.string().min(1, 'Title is required').max(200),
    description: z.string().max(1000).optional(),
  }),
};

export const updateDocumentSchema = {
  body: z.object({
    title: z.string().min(1, 'Title is required').max(200).optional(),
    description: z.string().max(1000).optional(),
    isArchived: z.boolean().optional(),
  }),
};

export const listDocumentsSchema = {
  query: z.object({
    search: z.string().optional(),
    mimeType: z.string().optional(),
    uploaderId: z.string().optional(),
    isArchived: z.string().optional().transform(v => v === 'true'),
    sortBy: z.enum(['createdAt', 'title', 'fileSizeBytes', 'updatedAt']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  }),
};
