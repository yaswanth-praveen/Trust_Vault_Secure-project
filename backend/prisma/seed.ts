import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { 
  GENESIS_HASH, 
  computeEventHash 
} from '../src/modules/audit/hashChain.service.js';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function main() {
  console.log('🌱 Starting TrustVault enterprise database seed...');

  // Ensure vault storage directory exists
  const vaultDir = path.resolve(process.cwd(), 'vault_storage');
  if (!fs.existsSync(vaultDir)) {
    fs.mkdirSync(vaultDir, { recursive: true });
  }

  // 1. Create Super Admin
  const superAdminPasswordHash = await hashPassword('SuperAdmin123!');
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@trustvault.com' },
    update: {},
    create: {
      email: 'superadmin@trustvault.com',
      fullName: 'System Super Administrator',
      passwordHash: superAdminPasswordHash,
      isSuperAdmin: true,
      status: 'ACTIVE',
    },
  });
  console.log(`✓ Super Admin created: ${superAdmin.email}`);

  // 2. Create Organization 1: Acme Corporation
  const acmeOrg = await prisma.organization.upsert({
    where: { slug: 'acme-corp' },
    update: {},
    create: {
      name: 'Acme Corporation',
      slug: 'acme-corp',
      status: 'ACTIVE',
    },
  });

  // 3. Create Acme Users
  const userPasswordHash = await hashPassword('UserPass123!');
  const adminPasswordHash = await hashPassword('AdminPass123!');
  const managerPasswordHash = await hashPassword('ManagerPass123!');
  const auditorPasswordHash = await hashPassword('AuditorPass123!');

  const acmeAdmin = await prisma.user.upsert({
    where: { email: 'admin@acme.com' },
    update: {},
    create: {
      email: 'admin@acme.com',
      fullName: 'Alice Vance (Org Admin)',
      passwordHash: adminPasswordHash,
      status: 'ACTIVE',
    },
  });

  const acmeManager = await prisma.user.upsert({
    where: { email: 'manager@acme.com' },
    update: {},
    create: {
      email: 'manager@acme.com',
      fullName: 'Bob Martinez (Doc Manager)',
      passwordHash: managerPasswordHash,
      status: 'ACTIVE',
    },
  });

  const acmeUser = await prisma.user.upsert({
    where: { email: 'user@acme.com' },
    update: {},
    create: {
      email: 'user@acme.com',
      fullName: 'Charlie Standard (Standard User)',
      passwordHash: userPasswordHash,
      status: 'ACTIVE',
    },
  });

  const acmeAuditor = await prisma.user.upsert({
    where: { email: 'auditor@acme.com' },
    update: {},
    create: {
      email: 'auditor@acme.com',
      fullName: 'Dana White (Compliance Auditor)',
      passwordHash: auditorPasswordHash,
      status: 'ACTIVE',
    },
  });

  // Create Acme Memberships
  const acmeMemberships = [
    { userId: acmeAdmin.id, role: 'ORG_ADMIN' },
    { userId: acmeManager.id, role: 'DOCUMENT_MANAGER' },
    { userId: acmeUser.id, role: 'STANDARD_USER' },
    { userId: acmeAuditor.id, role: 'AUDITOR' },
  ];

  for (const m of acmeMemberships) {
    await prisma.organizationMembership.upsert({
      where: {
        organizationId_userId: {
          organizationId: acmeOrg.id,
          userId: m.userId,
        },
      },
      update: { role: m.role },
      create: {
        organizationId: acmeOrg.id,
        userId: m.userId,
        role: m.role,
        status: 'ACTIVE',
      },
    });
  }
  console.log('✓ Acme Corporation users & memberships initialized');

  // 4. Create Organization 2: Globex Industries
  const globexOrg = await prisma.organization.upsert({
    where: { slug: 'globex-ind' },
    update: {},
    create: {
      name: 'Globex Industries',
      slug: 'globex-ind',
      status: 'ACTIVE',
    },
  });

  const globexAdmin = await prisma.user.upsert({
    where: { email: 'admin@globex.com' },
    update: {},
    create: {
      email: 'admin@globex.com',
      fullName: 'George Stone (Globex Admin)',
      passwordHash: adminPasswordHash,
      status: 'ACTIVE',
    },
  });

  const globexUser = await prisma.user.upsert({
    where: { email: 'user@globex.com' },
    update: {},
    create: {
      email: 'user@globex.com',
      fullName: 'Grace Hopper (Globex Engineer)',
      passwordHash: userPasswordHash,
      status: 'ACTIVE',
    },
  });

  await prisma.organizationMembership.upsert({
    where: { organizationId_userId: { organizationId: globexOrg.id, userId: globexAdmin.id } },
    update: {},
    create: { organizationId: globexOrg.id, userId: globexAdmin.id, role: 'ORG_ADMIN', status: 'ACTIVE' },
  });

  await prisma.organizationMembership.upsert({
    where: { organizationId_userId: { organizationId: globexOrg.id, userId: globexUser.id } },
    update: {},
    create: { organizationId: globexOrg.id, userId: globexUser.id, role: 'STANDARD_USER', status: 'ACTIVE' },
  });
  console.log('✓ Globex Industries users & memberships initialized');

  // 5. Seed Real Physical Documents in Vault
  const sampleDoc1Content = Buffer.from(
    'TRUSTVAULT CONFIDENTIAL DOCUMENT\n' +
    '---------------------------------\n' +
    'ACME CORPORATION: Q4 2026 Executive Financial Forecast\n\n' +
    'Total Revenue: $48,200,000\n' +
    'Gross Profit Margin: 74.2%\n' +
    'R&D Investment: $12,500,000\n' +
    'Security Audit Status: Passed (0 critical vulnerabilities)\n\n' +
    'CLASSIFICATION: STRICTLY CONFIDENTIAL - INTERNAL USE ONLY\n'
  );
  const sampleDoc1Key = `acme_q4_financial_report_${Date.now()}.txt`;
  fs.writeFileSync(path.resolve(vaultDir, sampleDoc1Key), sampleDoc1Content);
  const sampleDoc1Hash = crypto.createHash('sha256').update(sampleDoc1Content).digest('hex');

  const doc1 = await prisma.document.upsert({
    where: { storageKey: sampleDoc1Key },
    update: {},
    create: {
      organizationId: acmeOrg.id,
      uploaderId: acmeAdmin.id,
      title: 'Q4 2026 Executive Financial Forecast',
      description: 'Confidential executive financial summary and board forecast.',
      originalFilename: 'Acme_Q4_Financial_Forecast.txt',
      storageKey: sampleDoc1Key,
      mimeType: 'text/plain',
      fileSizeBytes: sampleDoc1Content.length,
      fileHashSha256: sampleDoc1Hash,
    },
  });

  const sampleDoc2Content = Buffer.from(
    '# TrustVault Zero-Trust Security Architecture Guide\n\n' +
    '1. Multi-Tenant Data Isolation with Strict Scoping\n' +
    '2. Ephemeral In-Memory Streaming (No Public URLs)\n' +
    '3. Cryptographic Tamper-Evident Hash Chain Logging (SHA-256)\n' +
    '4. Granular RBAC and Document-Level Permissions\n'
  );
  const sampleDoc2Key = `acme_security_policy_${Date.now()}.txt`;
  fs.writeFileSync(path.resolve(vaultDir, sampleDoc2Key), sampleDoc2Content);
  const sampleDoc2Hash = crypto.createHash('sha256').update(sampleDoc2Content).digest('hex');

  const doc2 = await prisma.document.upsert({
    where: { storageKey: sampleDoc2Key },
    update: {},
    create: {
      organizationId: acmeOrg.id,
      uploaderId: acmeManager.id,
      title: 'Zero-Trust Architecture Guidelines',
      description: 'Standard security practices and system architecture guide for Acme engineers.',
      originalFilename: 'Zero_Trust_Architecture.txt',
      storageKey: sampleDoc2Key,
      mimeType: 'text/plain',
      fileSizeBytes: sampleDoc2Content.length,
      fileHashSha256: sampleDoc2Hash,
    },
  });

  // Globex document
  const sampleGlobexContent = Buffer.from(
    'GLOBEX CONFIDENTIAL INTELLECTUAL PROPERTY\n' +
    'Proprietary Quantum Battery Patent Blueprint - Patent Pending #948271\n'
  );
  const sampleGlobexKey = `globex_patent_${Date.now()}.txt`;
  fs.writeFileSync(path.resolve(vaultDir, sampleGlobexKey), sampleGlobexContent);
  const sampleGlobexHash = crypto.createHash('sha256').update(sampleGlobexContent).digest('hex');

  await prisma.document.upsert({
    where: { storageKey: sampleGlobexKey },
    update: {},
    create: {
      organizationId: globexOrg.id,
      uploaderId: globexAdmin.id,
      title: 'Quantum Battery Patent Specification',
      description: 'Proprietary patent blueprints for Globex Industries.',
      originalFilename: 'Globex_Patent_Draft.txt',
      storageKey: sampleGlobexKey,
      mimeType: 'text/plain',
      fileSizeBytes: sampleGlobexContent.length,
      fileHashSha256: sampleGlobexHash,
    },
  });
  console.log('✓ Confidential documents written to private vault');

  // 6. Seed Document Shares
  // Share doc2 with Charlie Standard (Active VIEW share)
  await prisma.documentShare.create({
    data: {
      documentId: doc2.id,
      organizationId: acmeOrg.id,
      grantedToUserId: acmeUser.id,
      sharedByUserId: acmeManager.id,
      permission: 'VIEW',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  });

  // Share doc1 with Charlie Standard (Expired share for testing)
  await prisma.documentShare.create({
    data: {
      documentId: doc1.id,
      organizationId: acmeOrg.id,
      grantedToUserId: acmeUser.id,
      sharedByUserId: acmeAdmin.id,
      permission: 'DOWNLOAD',
      expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Expired yesterday
    },
  });
  console.log('✓ Document shares seeded (active & expired)');

  // 7. Seed Cryptographically Sound Audit Trail for Acme Corp
  // Clear any existing audit events for clean genesis
  await prisma.auditChainCheckpoint.deleteMany({ where: { organizationId: acmeOrg.id } });
  await prisma.auditEvent.deleteMany({ where: { organizationId: acmeOrg.id } });

  const auditEventsToCreate = [
    {
      action: 'ORGANIZATION_CREATED',
      actorId: superAdmin.id,
      resourceType: 'ORGANIZATION',
      resourceId: acmeOrg.id,
      outcome: 'SUCCESS',
      metadata: '{"name":"Acme Corporation","slug":"acme-corp"}',
      ipAddress: '127.0.0.1',
    },
    {
      action: 'USER_INVITED',
      actorId: acmeAdmin.id,
      resourceType: 'USER',
      resourceId: acmeManager.id,
      outcome: 'SUCCESS',
      metadata: '{"email":"manager@acme.com","role":"DOCUMENT_MANAGER"}',
      ipAddress: '192.168.1.10',
    },
    {
      action: 'DOCUMENT_UPLOAD',
      actorId: acmeAdmin.id,
      resourceType: 'DOCUMENT',
      resourceId: doc1.id,
      outcome: 'SUCCESS',
      metadata: `{"title":"${doc1.title}","sha256":"${doc1.fileHashSha256}"}`,
      ipAddress: '192.168.1.10',
    },
    {
      action: 'DOCUMENT_UPLOAD',
      actorId: acmeManager.id,
      resourceType: 'DOCUMENT',
      resourceId: doc2.id,
      outcome: 'SUCCESS',
      metadata: `{"title":"${doc2.title}","sha256":"${doc2.fileHashSha256}"}`,
      ipAddress: '192.168.1.25',
    },
    {
      action: 'DOCUMENT_SHARED',
      actorId: acmeManager.id,
      resourceType: 'DOCUMENT_SHARE',
      resourceId: doc2.id,
      outcome: 'SUCCESS',
      metadata: `{"grantedToUserId":"${acmeUser.id}","permission":"VIEW"}`,
      ipAddress: '192.168.1.25',
    },
  ];

  let previousHash = GENESIS_HASH;
  const baseTimestamp = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

  for (let i = 0; i < auditEventsToCreate.length; i++) {
    const raw = auditEventsToCreate[i];
    const sequenceNumber = i + 1;
    const timestamp = new Date(baseTimestamp.getTime() + i * 3600 * 1000);

    const eventHash = computeEventHash({
      organizationId: acmeOrg.id,
      sequenceNumber,
      previousHash,
      actorId: raw.actorId,
      action: raw.action,
      resourceType: raw.resourceType,
      resourceId: raw.resourceId,
      outcome: raw.outcome as 'SUCCESS' | 'FAILURE',
      timestamp,
      metadata: raw.metadata,
    });

    await prisma.auditEvent.create({
      data: {
        organizationId: acmeOrg.id,
        sequenceNumber,
        previousHash,
        eventHash,
        actorId: raw.actorId,
        action: raw.action,
        resourceType: raw.resourceType,
        resourceId: raw.resourceId,
        outcome: raw.outcome,
        ipAddress: raw.ipAddress,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        metadata: raw.metadata,
        timestamp,
      },
    });

    previousHash = eventHash;
  }

  // Record initial Checkpoint
  await prisma.auditChainCheckpoint.create({
    data: {
      organizationId: acmeOrg.id,
      lastSequenceNumber: auditEventsToCreate.length,
      checkpointHash: previousHash,
      verifiedAt: new Date(),
      status: 'VALID',
    },
  });

  console.log(`✓ Seeded ${auditEventsToCreate.length} tamper-evident audit records for Acme Corp with valid hash chain`);
  console.log('🎉 Database seeding complete!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
