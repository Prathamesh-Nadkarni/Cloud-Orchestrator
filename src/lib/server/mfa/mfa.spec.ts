import { describe, it, expect, vi } from 'vitest';
import { MfaService } from './index';
// Mocks to avoid hitting DB inside unit tests
vi.mock('../audit', () => ({
    AuditLogger: { log: vi.fn() }
}));

describe('MfaService', () => {
    it('should create a valid challenge', async () => {
        const userId = 'user-123';
        const challenge = await MfaService.createChallenge(userId, 'CLOUD_ACTIVATION');

        expect(challenge).toBeDefined();
        expect(challenge.challengeId).toBeDefined();
        expect(challenge.userId).toBe(userId);
        expect(challenge.context).toBe('CLOUD_ACTIVATION');
        expect(challenge.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('should reject an invalid challenge proof sequence', async () => {
        const userId = 'user-abc';
        const challenge = await MfaService.createChallenge(userId, 'LOGIN');

        // Wrong proof
        const isValid = await MfaService.verifyChallenge(challenge.challengeId, userId, 'WRONG_PROOF');
        expect(isValid).toBe(false);
    });

    it('should accept a valid challenge proof sequence', async () => {
        const userId = 'user-abc';
        const challenge = await MfaService.createChallenge(userId, 'LOGIN');

        const isValid = await MfaService.verifyChallenge(challenge.challengeId, userId, 'MOCK_VALID_PROOF');
        expect(isValid).toBe(true);
    });
});
