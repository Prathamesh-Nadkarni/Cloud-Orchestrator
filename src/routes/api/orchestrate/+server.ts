import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { OrchestrationWorker } from '$lib/server/orchestration';

export const POST: RequestHandler = async ({ request, locals }) => {
    if (!locals.session) return json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { connectionId, graph } = await request.json();

        const result = await OrchestrationWorker.submitExecution({
            tenantId: '00000000-0000-0000-0000-000000000001', // Mock
            userId: locals.session.userId,
            connectionId,
            visualGraph: graph
        });

        return json(result);
    } catch (err: any) {
        return json({ error: err.message }, { status: 400 });
    }
};
