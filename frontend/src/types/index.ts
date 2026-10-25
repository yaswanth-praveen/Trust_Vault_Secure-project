export type UserRole = 'SUPER_ADMIN' | 'ORG_ADMIN' | 'DOCUMENT_MANAGER' | 'STANDARD_USER' | 'AUDITOR';

export interface User {
  id: string;
  email: string;
  fullName: string;
  isSuperAdmin: boolean;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
  _count?: {
    memberships: number;
    documents: number;
    auditEvents: number;
    shares?: number;
  };
}

export interface Membership {
  id: string;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  role: UserRole;
}

export interface ActiveOrganization {
  id: string;
  name: string;
  slug: string;
  role: UserRole;
}

export interface Document {
  id: string;
  organizationId: string;
  uploaderId: string;
  title: string;
  description?: string | null;
  originalFilename: string;
  storageKey: string;
  mimeType: string;
  fileSizeBytes: number;
  fileHashSha256: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  uploader?: {
    id: string;
    fullName: string;
    email: string;
  };
  activeSharesCount?: number;
}

export interface DocumentShare {
  id: string;
  documentId: string;
  organizationId: string;
  grantedToUserId: string | null;
  sharedByUserId: string;
  permission: 'VIEW' | 'DOWNLOAD' | 'EDIT_METADATA' | 'SHARE' | 'MANAGE_PERMISSIONS';
  expiresAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  grantedToUser?: {
    id: string;
    fullName: string;
    email: string;
  } | null;
  sharedByUser?: {
    id: string;
    fullName: string;
    email: string;
  };
}

export interface AuditEvent {
  id: string;
  organizationId: string;
  sequenceNumber: number;
  previousHash: string;
  eventHash: string;
  actorId: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  outcome: 'SUCCESS' | 'FAILURE';
  ipAddress: string | null;
  userAgent: string | null;
  metadata: string | null;
  timestamp: string;
  actor?: {
    id: string;
    fullName: string;
    email: string;
  } | null;
}

export interface DashboardStats {
  totalDocuments: number;
  recentUploads: number;
  activeShares: number;
  totalUsers: number;
  failedAccessAttempts: number;
  auditIntegrityStatus: 'VALID' | 'CORRUPTED' | 'PENDING_FIRST_VERIFY';
  lastVerifiedAt: string | null;
  recentAuditActivities: AuditEvent[];
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
