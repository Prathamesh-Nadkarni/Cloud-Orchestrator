import { json } from '@sveltejs/kit';
import { VendorRegistryService } from '$lib/server/marketplace/registry';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }: { request: Request }) {
    try {
        const { submissionId, decision, notes, reviewerId } = await request.json();

        if (!submissionId || !decision) {
            return json({ error: 'Missing submissionId or decision' }, { status: 400 });
        }

        let result;
        if (decision === 'APPROVE') {
            result = await VendorRegistryService.approveSubmission(submissionId, reviewerId || 'system-admin', notes);
        } else {
            result = await VendorRegistryService.rejectSubmission(submissionId, reviewerId || 'system-admin', notes);
        }

        return json({ success: true, result });
    } catch (e: any) {
        return json({ error: e.message }, { status: 500 });
    }
}
