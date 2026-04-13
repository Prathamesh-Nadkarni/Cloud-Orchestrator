import { describe, it, expect, vi } from 'vitest';
import { OrchestrationWorker } from './index';

// Mock all dependencies
vi.mock('../db', () => ({
  prisma: {
    threatRule: { findMany: vi.fn().mockResolvedValue([]) },
  },
}));

vi.mock('../policy/engine', () => ({
  PolicyEngine: {
    evaluateOrchestration: vi.fn(),
  },
}));

vi.mock('../mfa', () => ({
  MfaService: {
    createChallenge: vi.fn().mockResolvedValue({ challengeId: 'chal-123' }),
  },
}));

vi.mock('../audit', () => ({
  AuditLogger: { log: vi.fn() },
}));

vi.mock('../cloud-connections', () => ({
  CloudConnectionService: {
    getConnection: vi.fn(),
  },
}));

import { PolicyEngine } from '../policy/engine';

describe('OrchestrationWorker', () => {
  it('returns a jobId on successful submission when policy allows', async () => {
    vi.mocked(PolicyEngine.evaluateOrchestration).mockResolvedValue({
      decision: 'ALLOW',
      findings: [],
    });

    const result = await OrchestrationWorker.submitExecution({
      tenantId: 'tenant-1',
      userId: 'user-1',
      connectionId: 'conn-1',
      visualGraph: { nodes: [], edges: [] },
    });

    expect(result.jobId).toBeDefined();
    expect(result.status).not.toBe('BLOCKED_BY_POLICY');
  });

  it('returns BLOCKED_BY_POLICY when policy denies', async () => {
    vi.mocked(PolicyEngine.evaluateOrchestration).mockResolvedValue({
      decision: 'DENY',
      findings: ['VPC creation blocked'],
    });

    const result = await OrchestrationWorker.submitExecution({
      tenantId: 'tenant-1',
      userId: 'user-1',
      connectionId: 'conn-1',
      visualGraph: { nodes: [], edges: [] },
    });

    expect(result.status).toBe('BLOCKED_BY_POLICY');
    expect(result.findings).toContain('VPC creation blocked');
  });

  it('returns MFA_PENDING when policy requires MFA', async () => {
    vi.mocked(PolicyEngine.evaluateOrchestration).mockResolvedValue({
      decision: 'MFA_REQUIRED',
      findings: ['Sensitive operation requires MFA'],
    });

    const result = await OrchestrationWorker.submitExecution({
      tenantId: 'tenant-1',
      userId: 'user-1',
      connectionId: 'conn-1',
      visualGraph: { nodes: [], edges: [] },
    });

    expect(result.status).toBe('MFA_PENDING');
    expect(result.challengeId).toBeDefined();
  });

  it('returns APPROVAL_REQUIRED when policy demands approval', async () => {
    vi.mocked(PolicyEngine.evaluateOrchestration).mockResolvedValue({
      decision: 'APPROVAL_REQUIRED',
      findings: ['Admin approval required'],
    });

    const result = await OrchestrationWorker.submitExecution({
      tenantId: 'tenant-1',
      userId: 'user-1',
      connectionId: 'conn-1',
      visualGraph: { nodes: [], edges: [] },
    });

    expect(result.status).toBe('APPROVAL_REQUIRED');
  });
});
