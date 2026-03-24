import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/server/db';

/**
 * List all versions for a specific diagram.
 */
export const GET: RequestHandler = async ({ params, locals }: any) => {
    if (!locals.session) return json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const versions = await prisma.diagramVersion.findMany({
            where: { diagramId: params.id },
            orderBy: { versionNumber: 'desc' },
            include: {
                terraformArtifact: {
                    select: {
                        validationStatus: true,
                        createdAt: true
                    }
                }
            }
        });

        return json({ versions });
    } catch (err: any) {
        return json({ error: err.message }, { status: 500 });
    }
};
