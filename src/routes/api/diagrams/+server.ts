import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { DiagramService } from '$lib/server/diagram';

const MOCK_TENANT_ID = '00000000-0000-0000-0000-000000000001';

/**
 * List diagrams for the current tenant.
 */
export const GET: RequestHandler = async ({ locals }: any) => {
    if (!locals.session) return json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const diagrams = await DiagramService.listDiagrams(MOCK_TENANT_ID);
        return json({ diagrams });
    } catch (err: any) {
        return json({ error: err.message }, { status: 500 });
    }
};

/**
 * Create a new diagram or save a new version of an existing one.
 */
export const POST: RequestHandler = async ({ request, locals }: any) => {
    if (!locals.session) return json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const { id, name, description, providers, topologySnapshot, resourceConfig, changeSummary, sourceMode, manualTerraform, manualK8s } = body;

        if (id) {
            // Update/Save version of existing diagram
            const version = await DiagramService.saveVersion(id, locals.session.userId, {
                topologySnapshot,
                resourceConfig,
                changeSummary,
                sourceMode,
                manualTerraform,
                manualK8s
            });
            return json({ success: true, version });
        } else {
            // Create new diagram design container
            const diagram = await DiagramService.createDiagram({
                tenantId: MOCK_TENANT_ID,
                ownerId: locals.session.userId,
                name: name || 'Untitled Diagram',
                description,
                providers: providers || [],
                topologySnapshot,
                resourceConfig
            });

            // Immediately create the first version record and generate Terraform
            const version = await DiagramService.saveVersion(diagram.id, locals.session.userId, {
                topologySnapshot,
                resourceConfig,
                changeSummary: 'Initial Check-in'
            });

            return json({ success: true, diagram, version });
        }
    } catch (err: any) {
        return json({ error: err.message }, { status: 400 });
    }
};
