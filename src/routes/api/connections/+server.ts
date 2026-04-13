import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { CloudConnectionService } from '$lib/server/cloud-connections';
import { CloudConnectionSchema } from '$lib/shared/schemas';

export const POST: RequestHandler = async (event) => {
    // Ensure the user is authenticated from +layout.server.ts context
    const user = event.locals?.user || event.locals; // Scaffold depending on hooks.server.ts mapping
    if (!user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const rawBody = await event.request.json();

        // Validate request payload
        const parsedData = CloudConnectionSchema.parse(rawBody);

        const { plaintextSecret, ...metadata } = rawBody;

        if (!plaintextSecret) {
            return json({ error: 'Missing cloud credential material' }, { status: 400 });
        }

        // Hand off to Cloud Connection service logic
        const connectionId = await CloudConnectionService.createConnection(
            parsedData.tenantId,
            user.id,
            metadata,
            plaintextSecret
        );

        return json({ message: 'Cloud connection created and sealed securely', connectionId });
    } catch (error: any) {
        console.error('Error creating cloud connection:', error);
        return json({ error: 'Invalid payload or server error' }, { status: 400 });
    }
};
