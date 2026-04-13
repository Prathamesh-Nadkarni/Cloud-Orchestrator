import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { EmergencyService } from '$lib/server/emergency';

export const POST: RequestHandler = async ({ request, locals }) => {
    if (!locals.session) return json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { action, connectionId, reason, durationMinutes } = await request.json();

        const tenantId = '00000000-0000-0000-0000-000000000001'; // Mock
        const userId = locals.session.userId;

        if (action === 'KILL_SWITCH') {
            await EmergencyService.engageKillSwitch(tenantId, userId, reason);
            return json({ success: true, message: 'Kill switch engaged' });
        }

        if (action === 'BREAK_GLASS') {
            const requestId = await EmergencyService.initiateBreakGlass({
                tenantId,
                userId,
                reason,
                durationMinutes: durationMinutes || 60
            });
            return json({ success: true, requestId });
        }

        if (action === 'QUARANTINE') {
            if (!connectionId) throw new Error('Missing connectionId');
            await EmergencyService.quarantineConnection(connectionId, userId, reason);
            return json({ success: true, message: 'Connection quarantined' });
        }

        throw new Error('Invalid emergency action');
    } catch (err: any) {
        return json({ error: err.message }, { status: 400 });
    }
};
