import { json } from '@sveltejs/kit';
import { VendorRegistryService } from '$lib/server/marketplace/registry';

/** @type {import('./$types').RequestHandler} */
export async function GET() {
    try {
        const submissions = await VendorRegistryService.getPendingSubmissions();
        return json(submissions);
    } catch (e: any) {
        return json({ error: e.message }, { status: 500 });
    }
}
