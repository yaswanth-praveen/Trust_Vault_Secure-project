import { describe, it, expect } from 'vitest';
import { 
  GENESIS_HASH, 
  computeEventHash, 
  verifyHashChain 
} from '../../src/modules/audit/hashChain.service.js';

describe('Tamper-Evident Hash Chain Unit Tests', () => {
  const orgId = 'org-test-uuid-1234';
  const baseTime = new Date('2026-10-25T12:00:00.000Z');

  function generateSampleChain(count: number) {
    const events: any[] = [];
    let prevHash = GENESIS_HASH;

    for (let seq = 1; seq <= count; seq++) {
      const timestamp = new Date(baseTime.getTime() + seq * 1000);
      const action = seq === 1 ? 'ORGANIZATION_CREATED' : 'DOCUMENT_UPLOAD';
      const resourceType = seq === 1 ? 'ORGANIZATION' : 'DOCUMENT';
      const resourceId = `res-${seq}`;
      const outcome = 'SUCCESS';
      const metadata = { index: seq };

      const eventHash = computeEventHash({
        organizationId: orgId,
        sequenceNumber: seq,
        previousHash: prevHash,
        actorId: 'user-1',
        action,
        resourceType,
        resourceId,
        outcome,
        timestamp,
        metadata,
      });

      events.push({
        organizationId: orgId,
        sequenceNumber: seq,
        previousHash: prevHash,
        eventHash,
        actorId: 'user-1',
        action,
        resourceType,
        resourceId,
        outcome,
        timestamp,
        metadata,
      });

      prevHash = eventHash;
    }

    return events;
  }

  it('successfully verifies a valid hash chain with 10 events', () => {
    const chain = generateSampleChain(10);
    const result = verifyHashChain(chain);

    expect(result.isValid).toBe(true);
    expect(result.totalEvents).toBe(10);
    expect(result.lastSequenceNumber).toBe(10);
    expect(result.headHash).toBe(chain[9].eventHash);
    expect(result.errorReason).toBeUndefined();
  });

  it('detects tampering when an event action or payload is altered', () => {
    const chain = generateSampleChain(5);
    
    // Maliciously alter action in event #3
    chain[2].action = 'UNAUTHORIZED_ALTERATION';

    const result = verifyHashChain(chain);

    expect(result.isValid).toBe(false);
    expect(result.errorSequence).toBe(3);
    expect(result.errorReason).toContain('Event data tampered at #3');
  });

  it('detects tampering when an event metadata is modified', () => {
    const chain = generateSampleChain(5);
    
    // Tamper with metadata in event #4
    chain[3].metadata = { index: 9999 };

    const result = verifyHashChain(chain);

    expect(result.isValid).toBe(false);
    expect(result.errorSequence).toBe(4);
    expect(result.errorReason).toContain('Event data tampered at #4');
  });

  it('detects deletion of an event (broken sequence gap)', () => {
    const chain = generateSampleChain(5);
    
    // Remove event #3
    chain.splice(2, 1);

    const result = verifyHashChain(chain);

    expect(result.isValid).toBe(false);
    expect(result.errorSequence).toBe(4);
    expect(result.errorReason).toContain('Sequence break detected');
  });

  it('detects broken previousHash linkage', () => {
    const chain = generateSampleChain(5);
    
    // Modify previousHash on event #2
    chain[1].previousHash = 'bad0000000000000000000000000000000000000000000000000000000000000';

    const result = verifyHashChain(chain);

    expect(result.isValid).toBe(false);
    expect(result.errorSequence).toBe(2);
    expect(result.errorReason).toContain('Hash link broken at #2');
  });

  it('returns valid for empty audit chain', () => {
    const result = verifyHashChain([]);
    expect(result.isValid).toBe(true);
    expect(result.totalEvents).toBe(0);
  });
});
