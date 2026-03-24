import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/server/db';

export const GET: RequestHandler = async ({ locals }) => {
    if (!locals.session) return json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch pending requests for the tenant or specifically assigned to the user
    // In prod: filter by tenant and permissions
    const requests = await prisma.approvalRequest.findMany({
        where: {
            status: 'PENDING'
        },
        include: {
            user: {
                select: { name: true, email: true }
            },
            connection: true
        },
        orderBy: {
            requestedAt: 'desc'
        }
    });

    return json({ requests });
};
