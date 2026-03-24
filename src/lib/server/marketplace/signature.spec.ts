import { describe, it, expect } from 'vitest';
import { MarketplaceSignatureService } from './signature';

describe('MarketplaceSignatureService', () => {
  const productId = 'prisma-cloud';
  const version = '1.2.3';
  const manifest = { name: 'Prisma Cloud', resources: ['scanner'] };

  describe('signPackage', () => {
    it('returns a hex string signature', () => {
      const sig = MarketplaceSignatureService.signPackage(productId, version, manifest);
      expect(sig).toMatch(/^[0-9a-f]{64}$/);
    });

    it('produces deterministic signatures for same inputs', () => {
      const sig1 = MarketplaceSignatureService.signPackage(productId, version, manifest);
      const sig2 = MarketplaceSignatureService.signPackage(productId, version, manifest);
      expect(sig1).toBe(sig2);
    });

    it('produces different signatures for different versions', () => {
      const sig1 = MarketplaceSignatureService.signPackage(productId, '1.0.0', manifest);
      const sig2 = MarketplaceSignatureService.signPackage(productId, '2.0.0', manifest);
      expect(sig1).not.toBe(sig2);
    });

    it('produces different signatures for different manifests', () => {
      const sig1 = MarketplaceSignatureService.signPackage(productId, version, { a: 1 });
      const sig2 = MarketplaceSignatureService.signPackage(productId, version, { a: 2 });
      expect(sig1).not.toBe(sig2);
    });
  });

  describe('verifyPackage', () => {
    it('returns true for a valid signature', () => {
      const sig = MarketplaceSignatureService.signPackage(productId, version, manifest);
      const valid = MarketplaceSignatureService.verifyPackage(productId, version, manifest, sig);
      expect(valid).toBe(true);
    });

    it('returns false for a tampered manifest', () => {
      const sig = MarketplaceSignatureService.signPackage(productId, version, manifest);
      const tampered = { ...manifest, name: 'Tampered' };
      const valid = MarketplaceSignatureService.verifyPackage(productId, version, tampered, sig);
      expect(valid).toBe(false);
    });

    it('returns false for a wrong version', () => {
      const sig = MarketplaceSignatureService.signPackage(productId, version, manifest);
      const valid = MarketplaceSignatureService.verifyPackage(productId, '9.9.9', manifest, sig);
      expect(valid).toBe(false);
    });

    it('throws on signature length mismatch (timing-safe comparison)', () => {
      expect(() =>
        MarketplaceSignatureService.verifyPackage(productId, version, manifest, 'short')
      ).toThrow();
    });
  });
});
