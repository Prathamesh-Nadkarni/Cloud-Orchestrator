import { describe, it, expect, vi } from 'vitest';
import { PolicyEngine } from './engine';

// Mock dependencies
vi.mock('../db', () => ({
  prisma: {
    threatRule: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock('../mfa', () => ({
  MfaService: {
    createChallenge: vi.fn(),
  },
}));

import { prisma } from '../db';

describe('PolicyEngine', () => {
  it('returns ALLOW when no rules match', async () => {
    vi.mocked(prisma.threatRule.findMany).mockResolvedValue([]);

    const result = await PolicyEngine.evaluateOrchestration({
      tenantId: 'tenant-1',
      userId: 'user-1',
      environment: 'production',
      action: 'DEPLOY',
      resourceScope: [],
      rawState: {},
    });

    expect(result.decision).toBe('ALLOW');
    expect(result.findings).toHaveLength(0);
  });

  it('returns DENY for CRITICAL severity match', async () => {
    vi.mocked(prisma.threatRule.findMany).mockResolvedValue([
      {
        id: 'rule-1',
        name: 'Block VPC creation',
        description: 'No new VPCs in prod',
        category: 'NETWORK',
        severityDefault: 'CRITICAL',
        enabled: true,
        assetScope: [],
        environmentScope: ['production'],
        protocolScope: [],
      },
    ] as any);

    const result = await PolicyEngine.evaluateOrchestration({
      tenantId: 'tenant-1',
      userId: 'user-1',
      environment: 'production',
      action: 'PROVISION_VPC',
      resourceScope: [],
      rawState: {},
    });

    expect(result.decision).toBe('DENY');
    expect(result.findings.length).toBeGreaterThan(0);
  });

  it('returns MFA_REQUIRED for HIGH severity match', async () => {
    vi.mocked(prisma.threatRule.findMany).mockResolvedValue([
      {
        id: 'rule-2',
        name: 'Block IAM changes',
        description: 'Requires MFA for IAM',
        category: 'IDENTITY',
        severityDefault: 'HIGH',
        enabled: true,
        assetScope: [],
        environmentScope: [],
        protocolScope: [],
      },
    ] as any);

    const result = await PolicyEngine.evaluateOrchestration({
      tenantId: 'tenant-1',
      userId: 'user-1',
      environment: 'production',
      action: 'IAM_CREATE_ROLE',
      resourceScope: [],
      rawState: {},
    });

    expect(result.decision).toBe('MFA_REQUIRED');
  });

  it('returns APPROVAL_REQUIRED for MEDIUM severity match', async () => {
    vi.mocked(prisma.threatRule.findMany).mockResolvedValue([
      {
        id: 'rule-3',
        name: 'Approve VPC changes',
        description: 'Needs approval',
        category: 'NETWORK',
        severityDefault: 'MEDIUM',
        enabled: true,
        assetScope: [],
        environmentScope: [],
        protocolScope: [],
      },
    ] as any);

    const result = await PolicyEngine.evaluateOrchestration({
      tenantId: 'tenant-1',
      userId: 'user-1',
      environment: 'production',
      action: 'PROVISION_VPC',
      resourceScope: [],
      rawState: {},
    });

    expect(result.decision).toBe('APPROVAL_REQUIRED');
  });

  it('picks the most restrictive decision when multiple rules match', async () => {
    vi.mocked(prisma.threatRule.findMany).mockResolvedValue([
      {
        id: 'rule-m',
        name: 'Medium rule',
        description: 'Approval needed',
        category: 'NETWORK',
        severityDefault: 'MEDIUM',
        enabled: true,
      },
      {
        id: 'rule-c',
        name: 'Critical rule',
        description: 'Block all',
        category: 'NETWORK',
        severityDefault: 'CRITICAL',
        enabled: true,
      },
    ] as any);

    const result = await PolicyEngine.evaluateOrchestration({
      tenantId: 'tenant-1',
      userId: 'user-1',
      environment: 'production',
      action: 'PROVISION_VPC',
      resourceScope: [],
      rawState: {},
    });

    expect(result.decision).toBe('DENY');
    expect(result.findings.length).toBe(2);
  });
});
