import { json } from '@sveltejs/kit';
import { DeploymentService } from '$lib/server/terraform/deployment';

/**
 * POST /api/diagrams/[id]/deploy
 * Trigger a new deployment action (PLAN, APPLY, DESTROY)
 */
export async function POST({ params, request, locals }: any) {
    if (!locals.session?.userId) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { versionId, type } = body;

        if (!versionId || !type) {
            return json({ error: 'Missing versionId or type' }, { status: 400 });
        }

        const run = await DeploymentService.startRun(params.id, versionId, locals.session.userId, type);
        return json({ success: true, run });
    } catch (err: any) {
        return json({ error: err.message }, { status: 500 });
    }
}

/**
 * GET /api/diagrams/[id]/deploy
 * List all deployment runs for this diagram
 */
export async function GET({ params, locals }: any) {
    if (!locals.session?.userId) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const runs = await DeploymentService.getRunHistory(params.id);
        return json({ success: true, runs });
    } catch (err: any) {
        return json({ error: err.message }, { status: 500 });
    }
}
