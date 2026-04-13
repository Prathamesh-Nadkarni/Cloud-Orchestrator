import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ProviderIntakeService } from '$lib/server/providers/intake';

export const POST: RequestHandler = async ({ request, locals }) => {
    if (!locals.session) return json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();

        // In prod: Use Zod to validate body
        const connectionId = await ProviderIntakeService.intake({
            tenantId: '00000000-0000-0000-0000-000000000001', // Mock tenant
            userId: locals.session.userId,
            provider: body.provider,
            displayName: body.displayName,
            credentialMaterial: body.credentials
        });

        return json({ success: true, connectionId });
    } catch (err: any) {
        return json({ error: err.message }, { status: 400 });
    }
};
