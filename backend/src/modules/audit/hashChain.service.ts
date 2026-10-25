import { sha256, canonicalJsonString } from '../../utils/crypto.js';

export const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

export interface AuditEventPayload {
  organizationId: string;
  sequenceNumber: number;
  previousHash: string;
  actorId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  outcome: 'SUCCESS' | 'FAILURE';
  timestamp: Date;
  metadata?: any;
}

/**
 * Deterministically computes the SHA-256 event hash linking to the previous hash.
 */
export function computeEventHash(payload: AuditEventPayload): string {
  const timestampIso = payload.timestamp.toISOString();
  const canonicalMeta = payload.metadata 
    ? (typeof payload.metadata === 'string' ? payload.metadata : canonicalJsonString(payload.metadata))
    : '';

  const rawString = [
    payload.previousHash,
    payload.organizationId,
    payload.sequenceNumber,
    payload.actorId || 'SYSTEM',
    payload.action,
    payload.resourceType,
    payload.resourceId || 'NONE',
    payload.outcome,
    timestampIso,
    canonicalMeta
  ].join(':');

  return sha256(rawString);
}

export interface VerificationResult {
  isValid: boolean;
  totalEvents: number;
  lastSequenceNumber: number;
  headHash: string | null;
  verifiedAt: string;
  errorSequence?: number;
  errorReason?: string;
}

/**
 * Cryptographically verifies an organization's audit event sequence.
 */
export function verifyHashChain(events: any[]): VerificationResult {
  const now = new Date().toISOString();
  if (events.length === 0) {
    return {
      isValid: true,
      totalEvents: 0,
      lastSequenceNumber: 0,
      headHash: null,
      verifiedAt: now
    };
  }

  let expectedPreviousHash = GENESIS_HASH;

  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const expectedSequence = i + 1;

    // Check sequence contiguity
    if (event.sequenceNumber !== expectedSequence) {
      return {
        isValid: false,
        totalEvents: events.length,
        lastSequenceNumber: events[events.length - 1].sequenceNumber,
        headHash: events[events.length - 1].eventHash,
        verifiedAt: now,
        errorSequence: event.sequenceNumber,
        errorReason: `Sequence break detected: expected #${expectedSequence}, found #${event.sequenceNumber}`
      };
    }

    // Check link to previous hash
    if (event.previousHash !== expectedPreviousHash) {
      return {
        isValid: false,
        totalEvents: events.length,
        lastSequenceNumber: events[events.length - 1].sequenceNumber,
        headHash: events[events.length - 1].eventHash,
        verifiedAt: now,
        errorSequence: event.sequenceNumber,
        errorReason: `Hash link broken at #${event.sequenceNumber}: previousHash does not match predecessor hash`
      };
    }

    // Recompute event hash
    const recomputedHash = computeEventHash({
      organizationId: event.organizationId,
      sequenceNumber: event.sequenceNumber,
      previousHash: event.previousHash,
      actorId: event.actorId,
      action: event.action,
      resourceType: event.resourceType,
      resourceId: event.resourceId,
      outcome: event.outcome as 'SUCCESS' | 'FAILURE',
      timestamp: new Date(event.timestamp),
      metadata: event.metadata
    });

    if (recomputedHash !== event.eventHash) {
      return {
        isValid: false,
        totalEvents: events.length,
        lastSequenceNumber: events[events.length - 1].sequenceNumber,
        headHash: events[events.length - 1].eventHash,
        verifiedAt: now,
        errorSequence: event.sequenceNumber,
        errorReason: `Event data tampered at #${event.sequenceNumber}: computed hash (${recomputedHash.substring(0, 10)}...) differs from stored hash (${event.eventHash.substring(0, 10)}...)`
      };
    }

    expectedPreviousHash = event.eventHash;
  }

  return {
    isValid: true,
    totalEvents: events.length,
    lastSequenceNumber: events[events.length - 1].sequenceNumber,
    headHash: events[events.length - 1].eventHash,
    verifiedAt: now
  };
}
