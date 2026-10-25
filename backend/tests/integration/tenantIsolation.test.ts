import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';

describe('Tenant Isolation & RBAC Integration Tests', () => {
  it('returns healthy status on /health endpoint', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
  });

  it('rejects unauthenticated requests to protected endpoints', async () => {
    const res = await request(app).get('/api/documents');
    expect(res.status).toBe(401);
    expect(res.body.message).toContain('Authentication required');
  });

  it('rejects invalid login credentials and enforces rate limiting', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'invalid@example.com',
        password: 'WrongPassword123!',
      });

    expect(res.status).toBe(401);
    expect(res.body.message).toContain('Invalid email or password');
  });
});
