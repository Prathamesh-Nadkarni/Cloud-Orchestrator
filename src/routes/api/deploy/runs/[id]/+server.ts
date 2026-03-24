import { json } from '@sveltejs/kit';
import { DeploymentService } from '$lib/server/terraform/deployment';

/**
 * GET /api/deploy/runs/[id]
 * Get status and logs for a specific run
 */
export async function GET({ params, locals }: any) {
    if (!locals.session?.userId) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const run = await DeploymentService.getRun(params.id);
        if (!run) return json({ error: 'Run not found' }, { status: 404 });
        return json({ success: true, run });
    } catch (err: any) {
        return json({ error: err.message }, { status: 500 });
    }
}
