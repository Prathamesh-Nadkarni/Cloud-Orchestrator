import crypto from 'crypto';

/**
 * Service for signing and verifying Vendor Integration Packages.
 * In a production environment, private keys would be managed via Vault or KMS.
 */
export class MarketplaceSignatureService {
    // Mock key for demonstration. Real keys should be in env vars.
    private static readonly PRIVATE_KEY = process.env.MARKETPLACE_PRIVATE_KEY || 'mock-private-key-for-dev-only-12345';
    private static readonly PUBLIC_KEY = process.env.MARKETPLACE_PUBLIC_KEY || 'mock-public-key-for-dev-only-12345';

    /**
     * Generate a signature for a package version.
     * Signs the composite string of [productId]:[version]:[manifestHash].
     */
    static signPackage(productId: string, version: string, manifestContent: any): string {
        const manifestString = JSON.stringify(manifestContent);
        const manifestHash = crypto.createHash('sha256').update(manifestString).digest('hex');
        const payload = `${productId}:${version}:${manifestHash}`;

        // Using HMAC-SHA256 for mock implementation. 
        // Prod should use RSA/ECDSA with actual key pairs.
        return crypto
            .createHmac('sha256', this.PRIVATE_KEY)
            .update(payload)
            .digest('hex');
    }

    /**
     * Verify a package signature.
     */
    static verifyPackage(productId: string, version: string, manifestContent: any, signature: string): boolean {
        const expectedSignature = this.signPackage(productId, version, manifestContent);
        return crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature)
        );
    }
}
