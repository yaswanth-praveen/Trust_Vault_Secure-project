# TrustVault — Secure Multi-Tenant Document Sharing with Tamper-Evident Audit Trail

TrustVault is an enterprise-grade, multi-tenant confidential document-sharing platform designed with strict organizational data isolation, granular role-based access control (RBAC), secure short-lived private document streaming, and an append-only, tamper-evident cryptographic audit trail powered by a linear SHA-256 hash chain.

---

## 1. System Architecture

```
                    ┌────────────────────────────────────────────────────────┐
                    │     Frontend (React 18 + Vite + Tailwind CSS + Lucide) │
                    │     TanStack Query + Role-Aware SPA Router             │
                    └───────────────────────────┬────────────────────────────┘
                                                │ (HTTPS + HTTP-only Cookie)
                                                ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        Backend API (Node.js + Express + TypeScript)                    │
│                                                                                        │
│  ┌───────────────────────┐  ┌────────────────────────┐  ┌───────────────────────────┐  │
│  │ Helmet Security Layer │  │  Strict CORS & Cookie   │  │ Rate Limiter (Brute Force)│  │
│  └───────────┬───────────┘  └───────────┬────────────┘  └─────────────┬─────────────┘  │
│              └──────────────────────────┼─────────────────────────────┘                │
│                                         ▼                                              │
│                        ┌─────────────────────────────────┐                             │
│                        │ Session Authentication & RBAC   │                             │
│                        └────────────────┬────────────────┘                             │
│                                         ▼                                              │
│                        ┌─────────────────────────────────┐                             │
│                        │ Multi-Tenant Isolation Firewall │                             │
│                        └────────────────┬────────────────┘                             │
│                                         │                                              │
│       ┌──────────────────────┬──────────┴───────────┬───────────────────────┐          │
│       ▼                      ▼                      ▼                       ▼          │
│ ┌───────────────┐   ┌────────────────┐   ┌─────────────────────┐   ┌─────────────────┐ │
│ │ Auth & Users  │   │ Organizations  │   │ Documents & Shares  │   │  Audit Engine   │ │
│ └───────┬───────┘   └────────┬───────┘   └──────────┬──────────┘   └────────┬────────┘ │
└─────────┼────────────────────┼──────────────────────┼───────────────────────┼──────────┘
          ▼                    ▼                      ▼                       ▼
 ┌───────────────────────────────────────────────────────┐       ┌──────────────────────┐
 │             PostgreSQL Database via Prisma            │       │ Private Vault Storage│
 │ (Organizations, Users, Sessions, Documents, Audits)   │       │ (Zero-Trust Local/S3)│
 └───────────────────────────────────────────────────────┘       └──────────────────────┘
```

---

## 2. Core Security & Architectural Capabilities

### Multi-Tenant Isolation
- Strict organizational data partitioning across users, documents, permissions, and audit logs.
- Backend middleware verifies tenant membership on every request (`where: { organizationId }`).
- Cross-tenant requests are automatically blocked with HTTP 403 and logged as security violation attempts in the audit trail.
- Client headers or URL alterations cannot bypass tenant boundaries.

### Tamper-Evident Cryptographic Audit Trail
- Each organization maintains an independent, append-only, sequentially numbered audit trail.
- Every event computes a SHA-256 hash linking to the previous event's hash:
  $$\text{eventHash} = \text{SHA-256}(\text{previousHash} \parallel ":" \parallel \text{canonicalEventData})$$
- The Genesis event links to a 64-character zero string:
  `0000000000000000000000000000000000000000000000000000000000000000`
- **Integrity Verification Function**: Recomputes the entire chain from block 1 to $N$. If any record was modified, deleted, or reordered, verification immediately flags the failure and pinpoints the corrupted sequence number.
- **CSV Export**: Authorizes Compliance Auditors and Org Admins to export verifiable audit records for external compliance reviews.

### Private Document Storage & In-Memory Streaming
- Confidential documents are never exposed through public URLs or static web servers.
- Uploaded files are stored in a private directory with collision-resistant randomized keys.
- Every download and preview request validates document permissions on the backend before streaming bytes through ephemeral pipes.
- File extensions, MIME types, and SHA-256 integrity digests are calculated upon upload.

### Role-Based Access Control (RBAC)
| Role | Capabilities |
|---|---|
| **SUPER_ADMIN** | Platform oversight, provision & suspend organizations, platform metrics. |
| **ORG_ADMIN** | Manage tenant users, assign roles, manage all org documents & shares, inspect audit trail. |
| **DOCUMENT_MANAGER** | Upload, edit metadata, share documents, manage document permissions. |
| **STANDARD_USER** | Upload documents, view & download shared documents according to explicit grants. |
| **AUDITOR** | Read-only compliance access to audit logs, CSV exports, and cryptographic verification. |

---

## 3. Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, TanStack Query, Lucide React, React Router v7
- **Backend**: Node.js, Express, TypeScript, Zod, Prisma ORM, Helmet, Rate Limiter, Cookie Parser, Multer, Bcrypt
- **Database**: PostgreSQL (with dual SQLite support for instant local testing)
- **Containerization**: Docker & Docker Compose
- **Testing**: Vitest, Supertest

---

## 4. Quick Start (Local Zero-Dependency Mode)

TrustVault is configured to run locally out-of-the-box on Node.js without requiring Docker or a local PostgreSQL installation.

### Step 1: Install Dependencies
```bash
# In the repository root
cd backend
npm install

cd ../frontend
npm install
```

### Step 2: Initialize Database and Seed Realistic Enterprise Data
```bash
cd backend
npm run db:push:sqlite
npm run db:seed
```

### Step 3: Run the Application
In terminal 1 (Backend API):
```bash
cd backend
npm run dev
# Running on http://localhost:5000
```

In terminal 2 (Frontend Client):
```bash
cd frontend
npm run dev
# Running on http://localhost:5173
```

Open `http://localhost:5173` in your browser.

---

## 5. Docker Compose Deployment (Production / PostgreSQL)

To launch the complete containerized stack (PostgreSQL + Backend + Frontend):

```bash
docker compose up --build -d
```
- Frontend UI: `http://localhost:3000`
- Backend API: `http://localhost:5000`
- PostgreSQL: `localhost:5432`

---

## 6. Demo Accounts & Seed Credentials

The database comes pre-seeded with realistic enterprise data across two isolated organizations (**Acme Corporation** and **Globex Industries**):

| Role | Email | Password | Organization |
|---|---|---|---|
| **Super Admin** | `superadmin@trustvault.com` | `SuperAdmin123!` | System-wide |
| **Acme Org Admin** | `admin@acme.com` | `AdminPass123!` | Acme Corporation |
| **Acme Auditor** | `auditor@acme.com` | `AuditorPass123!` | Acme Corporation |
| **Acme Doc Manager** | `manager@acme.com` | `ManagerPass123!` | Acme Corporation |
| **Acme Standard User** | `user@acme.com` | `UserPass123!` | Acme Corporation |
| **Globex Org Admin** | `admin@globex.com` | `AdminPass123!` | Globex Industries |
| **Globex Engineer** | `user@globex.com` | `UserPass123!` | Globex Industries |

*Tip: The login page includes quick-fill buttons to authenticate into any role with a single click.*

---

## 7. Automated Test Suite

TrustVault includes automated unit and integration tests covering hash-chain verification, tamper detection, permission enforcement, and tenant isolation:

```bash
cd backend
npm test
```

### Test Coverage Highlights:
- `tests/unit/hashChain.test.ts`:
  - Genesis block validation
  - 10-event consecutive link verification
  - Detection of altered payloads or metadata
  - Detection of sequence gaps (deleted events)
  - Detection of broken predecessor hashes
- `tests/unit/permissions.test.ts`:
  - Granular permission matrix validation (`VIEW`, `DOWNLOAD`, `EDIT_METADATA`, `SHARE`, `MANAGE_PERMISSIONS`)
- `tests/integration/tenantIsolation.test.ts`:
  - API health verification
  - Authentication barrier enforcement
  - Brute force login rate limiting

---

## 8. REST API Reference

### Authentication
- `POST /api/auth/login` — Authenticate and issue HTTP-only session cookie
- `POST /api/auth/logout` — Invalidate session and destroy cookie
- `GET /api/auth/me` — Retrieve active profile, memberships, and role
- `POST /api/auth/switch-org` — Switch active tenant organization context

### Organizations
- `GET /api/organizations` — List tenant organizations (Super Admin sees all)
- `POST /api/organizations` — Provision new organization (Super Admin only)
- `GET /api/organizations/:organizationId` — Get organization details
- `PATCH /api/organizations/:organizationId` — Update organization name or status
- `GET /api/organizations/:organizationId/stats` — Real-time security and document metrics

### User Management
- `GET /api/organizations/:organizationId/users` — List members and pending invitations
- `POST /api/organizations/:organizationId/invitations` — Invite a new member with role
- `PATCH /api/organizations/:organizationId/users/:userId/role` — Update member role
- `PATCH /api/organizations/:organizationId/users/:userId/status` — Activate or suspend member

### Documents & Vault
- `GET /api/documents` — List documents (searched, filtered, sorted, paginated)
- `POST /api/documents/upload` — Upload multipart file to private vault
- `GET /api/documents/:documentId` — Retrieve metadata, permissions, and SHA-256 digest
- `GET /api/documents/:documentId/download` — Authorized streaming download
- `GET /api/documents/:documentId/preview` — Authorized inline streaming preview
- `PATCH /api/documents/:documentId` — Update title, description, or archive status
- `DELETE /api/documents/:documentId` — Delete document and associated shares

### Document Sharing
- `POST /api/documents/:documentId/shares` — Grant share (specific user or org-wide) with optional expiry
- `GET /api/documents/:documentId/shares` — List active, expired, and revoked shares
- `PATCH /api/documents/:documentId/shares/:shareId` — Update permission level or expiry
- `DELETE /api/documents/:documentId/shares/:shareId` — Revoke share immediately

### Cryptographic Audit Trail
- `GET /api/audit-events` — Query and filter audit events
- `GET /api/audit-events/:eventId` — Inspect complete audit event details and payload
- `POST /api/audit-events/verify` — Execute cryptographic hash chain verification
- `GET /api/audit-events/export` — Export tenant audit logs to CSV

---

## 9. Troubleshooting & FAQ

**Q: Can I run this with Docker without installing Node.js?**  
A: Yes! Simply run `docker compose up --build` in the root directory.

**Q: How does TrustVault verify audit logs haven't been tampered with?**  
A: The backend audit service traverses the linear sequence of records for the tenant, recalculating `SHA-256(previousHash + ":" + payload)` for every record and verifying that `previousHash` equals the predecessor's hash. If a single byte is altered in any record or if an entry is removed, the verification endpoint reports `isValid: false` and returns the exact corrupted sequence number.

**Q: How does TrustVault prevent cross-tenant data leaks?**  
A: Every tenant-scoped request is validated against the authenticated user's active membership in PostgreSQL. Passing another organization's ID or document ID results in an immediate 403 Forbidden and generates an unauthorized access audit record.
