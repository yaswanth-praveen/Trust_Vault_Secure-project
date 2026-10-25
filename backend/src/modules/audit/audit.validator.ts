import { z } from 'zod';

export const listAuditEventsSchema = {
  query: z.object({
    search: z.string().optional(),
    actorId: z.string().optional(),
    action: z.string().optional(),
    resourceType: z.string().optional(),
    outcome: z.enum(['SUCCESS', 'FAILURE']).optional(),
    fromDate: z.string().optional(),
    toDate: z.string().optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  }),
};
