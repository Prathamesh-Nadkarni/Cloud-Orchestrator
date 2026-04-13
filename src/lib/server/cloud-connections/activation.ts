// Activation Grant Service
// Issues time-boxed grants allowing specific backend workers to use unsealed cloud credentials.

import { prisma } from '../db';
import { AuditLogger } from '../audit';

export class ActivationGrantService {
    /**
     * Issues a new grant. If a grant requires MFA, it starts in MFA_PENDING.
     * Otherwise, it becomes ACTIVE immediately.
     */
    static async issueGrant(
        tenantId: string,
        connectionId: string,
        userId: string,
        workerClass: string,
        actions: string[],
        ttlSeconds: number = 3600,
        requiresMfa: boolean = false
    ): Promise<string> {

        const status = requiresMfa ? 'MFA_PENDING' : 'ACTIVE';

        const grant = await prisma.activationGrant.create({
            data: {
                tenantId,
                connectionId,
                issuedByUserId: userId,
                issuedToWorker: workerClass,
                issuedForActions: actions,
                ttl: ttlSeconds,
                status
            }
        });

        // Update connection to ACTIVE_RUNTIME if the grant is immediately active
        if (status === 'ACTIVE') {
            await prisma.cloudConnection.update({
                where: { id: connectionId },
                data: { state: 'ACTIVE_RUNTIME', lastActivatedAt: new Date() }
            });
        }

        await AuditLogger.log({
            tenantId,
            actorId: userId,
            action: 'CLOUD_CONNECTION_ACTIVATED',
            targetRef: connectionId,
            status: 'SUCCESS',
            metadata: { grantId: grant.id, workerClass, actions, requiresMfa }
        });

        return grant.id;
    }

    /**
     * Approves a PENDING grant after successful MFA or explicit approval process
     */
    static async approveGrant(grantId: string): Promise<void> {
        const grant = await prisma.activationGrant.update({
            where: { id: grantId },
            data: { status: 'ACTIVE', mfaVerifiedAt: new Date() }
        });

        await prisma.cloudConnection.update({
            where: { id: grant.connectionId },
            data: { state: 'ACTIVE_RUNTIME', lastActivatedAt: new Date() }
        });
    }

    /**
     * Revokes an active grant, safely relocking the cloud connection
     */
    static async revokeGrant(grantId: string): Promise<void> {
        const grant = await prisma.activationGrant.update({
            where: { id: grantId },
            data: { status: 'REVOKED' }
        });

        await prisma.cloudConnection.update({
            where: { id: grant.connectionId },
            data: { state: 'SEALED' }
        });
    }
}
