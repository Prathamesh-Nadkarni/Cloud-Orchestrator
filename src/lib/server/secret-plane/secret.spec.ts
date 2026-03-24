import { describe, it, expect } from 'vitest';
import { SecretBroker } from './index';

describe('SecretBroker', () => {
    it('should seal a secret correctly and never return the plaintext', async () => {
        const tenantId = 'test-tenant';
        const plaintext = 'my-super-secret-password';

        const secretMaterial = await SecretBroker.sealSecret(tenantId, plaintext);

        expect(secretMaterial).toBeDefined();
        expect(secretMaterial.ciphertextBlobRef).toBeDefined();
        expect(secretMaterial.wrappedDekRef).toBeDefined();
        expect(secretMaterial.version).toBe(1);

        // Ensure plaintext is enveloped conceptually
        expect(secretMaterial.ciphertextBlobRef).not.toContain(plaintext);
        expect(secretMaterial.wrappedDekRef).not.toContain(plaintext);
    });

    it('should unseal a secret returning the plaintext string', async () => {
        const material = {
            ciphertextBlobRef: 'test',
            wrappedDekRef: 'test',
            version: 1,
        };

        const unsealed = await SecretBroker.unsealSecret('tenant-id', material, 'grant-123');

        expect(unsealed).toBe('MOCK_PLAINTEXT_DO_NOT_EXPOSE');
    });
});
