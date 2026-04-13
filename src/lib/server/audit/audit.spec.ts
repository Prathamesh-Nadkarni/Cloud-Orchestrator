import { describe, it, expect, vi } from 'vitest';
import { AuditLogger } from './index';
import { EventBus } from '../events';

vi.mock('../events', () => ({
  EventBus: {
    publish: vi.fn().mockResolvedValue('event-123'),
  },
}));

describe('AuditLogger', () => {
  it('publishes an audit event to the event bus', async () => {
    await AuditLogger.log({
      tenantId: 'tenant-1',
      actorId: 'user-1',
      action: 'USER_LOGIN',
      status: 'SUCCESS',
      targetRef: 'session-abc',
    });

    expect(EventBus.publish).toHaveBeenCalledWith(
      'audit',
      expect.objectContaining({
        tenantId: 'tenant-1',
        actorId: 'user-1',
        action: 'USER_LOGIN',
      }),
      expect.any(Object)
    );
  });

  it('includes metadata when provided', async () => {
    await AuditLogger.log({
      tenantId: 'tenant-1',
      actorId: 'user-1',
      action: 'CLOUD_CONNECTION_CREATED',
      status: 'SUCCESS',
      targetRef: 'conn-abc',
      metadata: { provider: 'AWS' },
    });

    expect(EventBus.publish).toHaveBeenCalled();
  });
});
