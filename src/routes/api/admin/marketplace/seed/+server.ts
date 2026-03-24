import { json } from '@sveltejs/kit';
import { VendorRegistryService } from '$lib/server/marketplace/registry';

/**
 * POST /api/admin/marketplace/seed
 * Seed the marketplace with initial vendors and products for demonstration.
 */
export async function POST() {
    try {
        // 1. Seed Core Vendors
        const hashicorp = await VendorRegistryService.seedSystemVendor('HashiCorp', 'hashicorp');
        const f5 = await VendorRegistryService.seedSystemVendor('F5 Networks', 'f5');
        const crowdstrike = await VendorRegistryService.seedSystemVendor('CrowdStrike', 'crowdstrike');

        // 2. Submit initial packages (Simulated)
        // HashiCorp Consul
        await VendorRegistryService.submitPackage(hashicorp.id, {
            vendor: { name: 'HashiCorp', slug: 'hashicorp' },
            product: {
                name: 'Consul',
                slug: 'consul',
                category: 'Networking',
                description: 'Service mesh and service discovery platform.',
                shortDescription: 'Connect and secure any service.',
                supportedProviders: ['aws', 'azure', 'gcp', 'k8s']
            },
            package: { version: '1.17.0', formatVersion: '1.0.0' }
        }, {});

        // F5 BIG-IP WAF
        await VendorRegistryService.submitPackage(f5.id, {
            vendor: { name: 'F5 Networks', slug: 'f5' },
            product: {
                name: 'BIG-IP Advanced WAF',
                slug: 'big-ip-waf',
                category: 'Security',
                description: 'Protect apps from modern threats with layer 7 security.',
                shortDescription: 'Industry-leading Web Application Firewall.',
                supportedProviders: ['aws', 'azure', 'gcp']
            },
            package: { version: '17.1.0', formatVersion: '1.0.0' }
        }, {});

        return json({ success: true, message: 'Marketplace seeded' });
    } catch (error: any) {
        return json({ error: error.message }, { status: 500 });
    }
}
