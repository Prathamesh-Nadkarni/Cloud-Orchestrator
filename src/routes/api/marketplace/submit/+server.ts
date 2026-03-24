import { json } from '@sveltejs/kit';
import { VendorRegistryService } from '$lib/server/marketplace/registry';

/**
 * POST /api/marketplace/submit
 * Submit a new package bundle for review.
 */
export async function POST({ request }: any) {
    try {
        const { vendorId, manifest, packageData } = await request.json();

        if (!vendorId || !manifest) {
            return json({ error: 'Missing vendorId or manifest' }, { status: 400 });
        }

        const pkg = await VendorRegistryService.submitPackage(vendorId, manifest, packageData);
        return json({ success: true, packageId: pkg.id, status: 'SUBMITTED' });
    } catch (error: any) {
        return json({ error: error.message }, { status: 500 });
    }
}
