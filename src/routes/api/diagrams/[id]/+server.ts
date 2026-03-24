import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/server/db';
import { DiagramService } from '$lib/server/diagram';
import { TerraformArtifactService } from '$lib/server/terraform/artifact';

/**
 * Get a single diagram with its latest snapshot and available versions.
 */
export const GET: RequestHandler = async ({ params, locals }) => {
    if (!locals.session) return json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const diagram = await DiagramService.getDiagram(params.id!);
        if (!diagram) return json({ error: 'Diagram not found' }, { status: 404 });

        // Optionally include the files for the current version if it exists
        let latestFiles = [];
        if (diagram.currentVersionId) {
            const version = await prisma.diagramVersion.findUnique({
                where: { id: diagram.currentVersionId }
            });
            if (version?.terraformArtifactId) {
                latestFiles = await TerraformArtifactService.getArtifactFiles(version.terraformArtifactId);
            }
        }

        return json({ diagram, latestFiles });
    } catch (err: any) {
        return json({ error: err.message }, { status: 500 });
    }
};

/**
 * Archive a diagram.
 */
export const DELETE: RequestHandler = async ({ params, locals }) => {
    if (!locals.session) return json({ error: 'Unauthorized' }, { status: 401 });

    try {
        await DiagramService.archiveDiagram(params.id!);
        return json({ success: true });
    } catch (err: any) {
        return json({ error: err.message }, { status: 500 });
    }
};
