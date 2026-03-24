import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { IntelligenceService } from '$lib/server/intelligence';

export const GET: RequestHandler = async ({ url, locals }) => {
    if (!locals.session) return json({ error: 'Unauthorized' }, { status: 401 });

    const connectionId = url.searchParams.get('connectionId');
    if (!connectionId) return json({ error: 'Missing connectionId' }, { status: 400 });

    try {
        const overlay = await IntelligenceService.getTopologyOverlays(connectionId);
        return json({ overlay });
    } catch (err: any) {
        return json({ error: err.message }, { status: 400 });
    }
};
