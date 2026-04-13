import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { IntelligenceService } from '$lib/server/intelligence';

export const GET: RequestHandler = async ({ locals }) => {
    if (!locals.session) return json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const findings = await IntelligenceService.runHeuristics(
            '00000000-0000-0000-0000-000000000001' // Mock tenant
        );

        return json({ findings });
    } catch (err: any) {
        return json({ error: err.message }, { status: 400 });
    }
};
