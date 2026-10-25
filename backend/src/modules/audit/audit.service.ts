import { prisma } from '../../utils/prisma.js';
import { 
  GENESIS_HASH, 
  computeEventHash, 
  verifyHashChain, 
  VerificationResult 
} from './hashChain.service.js';
import { canonicalJsonString } from '../../utils/crypto.js';
import { convertAuditEventsToCsv } from '../../utils/csvExporter.js';

export interface RecordAuditParams {
  organizationId: string;
  actorId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  outcome?: 'SUCCESS' | 'FAILURE';
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: any;
}

export class AuditService {
  /**
   * Appends an immutable, tamper-evident audit record to the organization's hash chain.
   */
  public static async record(params: RecordAuditParams) {
    const outcome = params.outcome || 'SUCCESS';
    const timestamp = new Date();
    const metadataString = params.metadata 
      ? (typeof params.metadata === 'string' ? params.metadata : canonicalJsonString(params.metadata))
      : null;

    // Use transaction to ensure safe sequential ordering
    return prisma.$transaction(async (tx) => {
      // Find latest event for this organization
      const lastEvent = await tx.auditEvent.findFirst({
        where: { organizationId: params.organizationId },
        orderBy: { sequenceNumber: 'desc' },
        select: { sequenceNumber: true, eventHash: true },
      });

      const nextSequence = (lastEvent?.sequenceNumber || 0) + 1;
      const previousHash = lastEvent?.eventHash || GENESIS_HASH;

      const eventHash = computeEventHash({
        organizationId: params.organizationId,
        sequenceNumber: nextSequence,
        previousHash,
        actorId: params.actorId,
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        outcome,
        timestamp,
        metadata: metadataString,
      });

      const createdEvent = await tx.auditEvent.create({
        data: {
          organizationId: params.organizationId,
          sequenceNumber: nextSequence,
          previousHash,
          eventHash,
          actorId: params.actorId || null,
          action: params.action,
          resourceType: params.resourceType,
          resourceId: params.resourceId || null,
          outcome,
          ipAddress: params.ipAddress || null,
          userAgent: params.userAgent || null,
          metadata: metadataString,
          timestamp,
        },
      });

      return createdEvent;
    });
  }

  /**
   * Query and filter audit events with pagination.
   */
  public static async listEvents(
    organizationId: string,
    filters: {
      search?: string;
      actorId?: string;
      action?: string;
      resourceType?: string;
      outcome?: string;
      fromDate?: string;
      toDate?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = { organizationId };

    if (filters.actorId) {
      where.actorId = filters.actorId;
    }
    if (filters.action) {
      where.action = filters.action;
    }
    if (filters.resourceType) {
      where.resourceType = filters.resourceType;
    }
    if (filters.outcome) {
      where.outcome = filters.outcome;
    }
    if (filters.fromDate || filters.toDate) {
      where.timestamp = {};
      if (filters.fromDate) where.timestamp.gte = new Date(filters.fromDate);
      if (filters.toDate) where.timestamp.lte = new Date(filters.toDate);
    }
    if (filters.search) {
      where.OR = [
        { action: { contains: filters.search } },
        { resourceType: { contains: filters.search } },
        { resourceId: { contains: filters.search } },
        { metadata: { contains: filters.search } },
      ];
    }

    const [total, events] = await Promise.all([
      prisma.auditEvent.count({ where }),
      prisma.auditEvent.findMany({
        where,
        orderBy: { sequenceNumber: 'desc' },
        skip,
        take: limit,
        include: {
          actor: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      }),
    ]);

    return {
      events,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Retrieves single audit event by ID with tenant scope.
   */
  public static async getEventById(organizationId: string, eventId: string) {
    return prisma.auditEvent.findFirst({
      where: {
        id: eventId,
        organizationId,
      },
      include: {
        actor: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Exports filtered or all audit events to CSV format.
   */
  public static async exportEventsCsv(organizationId: string) {
    const events = await prisma.auditEvent.findMany({
      where: { organizationId },
      orderBy: { sequenceNumber: 'asc' },
      include: {
        actor: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    return convertAuditEventsToCsv(events);
  }

  /**
   * Performs cryptographic verification across the organization's complete hash chain.
   */
  public static async verifyChain(organizationId: string): Promise<VerificationResult> {
    const events = await prisma.auditEvent.findMany({
      where: { organizationId },
      orderBy: { sequenceNumber: 'asc' },
    });

    const result = verifyHashChain(events);

    // Save checkpoint record
    await prisma.auditChainCheckpoint.create({
      data: {
        organizationId,
        lastSequenceNumber: result.lastSequenceNumber,
        checkpointHash: result.headHash || GENESIS_HASH,
        verifiedAt: new Date(),
        status: result.isValid ? 'VALID' : 'CORRUPTED',
      },
    });

    return result;
  }
}
