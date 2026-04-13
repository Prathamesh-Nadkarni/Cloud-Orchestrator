import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ApprovalService } from '$lib/server/approvals';

export const POST: RequestHandler = async ({ request, locals }) => {
    // Only authenticated users can submit decisions
    if (!locals.session) return json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { requestId, decision, notes } = await request.json();

        await ApprovalService.submitDecision(
            requestId,
            locals.session.userId,
            decision,
            notes
        );

        return json({ success: true });
    } catch (err: any) {
        return json({ error: err.message }, { status: 400 });
    }
};
