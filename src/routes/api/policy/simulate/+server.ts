import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PolicyBundleService } from '$lib/server/policy/bundle';

export const POST: RequestHandler = async ({ request, locals }) => {
    if (!locals.session) return json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { bundleId, newRules } = await request.json();

        const result = await PolicyBundleService.simulateImpact({
            tenantId: '00000000-0000-0000-0000-000000000001',
            bundleId,
            newRules
        });

        return json(result);
    } catch (err: any) {
        return json({ error: err.message }, { status: 400 });
    }
};
