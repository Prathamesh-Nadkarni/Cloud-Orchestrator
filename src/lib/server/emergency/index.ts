// Emergency Control Service
// Manages high-stakes operations: Break-Glass, Kill Switches, and Quarantines.

import { prisma } from '../db';
import { AuditLogger } from '../audit';
import { NotificationService } from '../notifications';

export class EmergencyService {
    /**
     * Activates a tenant-wide Kill Switch.
     * Revokes all active grants and prevents new activations.
     */
    static async engageKillSwitch(tenantId: string, userId: string, reason: string): Promise<void> {
        await prisma.$transaction([
            // 1. Mark the kill switch in the tenant
            prisma.tenant.update({
                where: { id: tenantId },
                data: {
                    // Note: We'd need an activeKillSwitch column or use an EmergencyAction record
                }
            }),
            // 2. Revoke all active activation grants
            prisma.activationGrant.updateMany({
                where: { tenantId, status: 'ACTIVE' },
                data: { status: 'REVOKED' }
            }),
            // 3. Mark all connections as locked
            prisma.cloudConnection.updateMany({
                where: { tenantId },
                data: { killSwitchActive: true, state: 'LOCKED' }
            }),
            // 4. Log the action
            prisma.emergencyControlAction.create({
                data: {
                    tenantId,
                    actorId: userId,
                    actionType: 'KILL_SWITCH',
                    reason
                }
            })
        ]);

        await AuditLogger.log({
            tenantId,
            actorId: userId,
            action: 'KILL_SWITCH_ENGAGED',
            status: 'SUCCESS',
            metadata: { reason }
        });

        await NotificationService.send({
            userId: 'SYSTEM', // Notify all tenant admins
            type: 'EMERGENCY_KILL_SWITCH',
            title: 'KILL SWITCH ENGAGED',
            body: `Emergency kill switch active: ${reason}`,
            metadata: { actorId: userId }
        });
    }

    /**
     * Initiates a Break-Glass session.
     * Allows privileged access bypassing some policy checks for a limited time.
     */
    static async initiateBreakGlass(params: {
        tenantId: string;
        userId: string;
        reason: string;
        durationMinutes: number;
    }): Promise<string> {
        const expiresAt = new Date(Date.now() + params.durationMinutes * 60 * 1000);

        const request = await prisma.breakGlassRequest.create({
            data: {
                tenantId: params.tenantId,
                userId: params.userId,
                reason: params.reason,
                status: 'ACTIVE',
                expiresAt
            }
        });

        await AuditLogger.log({
            tenantId: params.tenantId,
            actorId: params.userId,
            action: 'CLOUD_CONNECTION_ACTIVATED', // Use appropriate action
            targetRef: request.id,
            status: 'SUCCESS',
            metadata: { type: 'BREAK_GLASS', durationMinutes: params.durationMinutes }
        });

        return request.id;
    }

    /**
     * Quarantines a single cloud connection.
     */
    static async quarantineConnection(connectionId: string, userId: string, reason: string): Promise<void> {
        await prisma.cloudConnection.update({
            where: { id: connectionId },
            data: {
                quarantineState: 'QUARANTINED',
                state: 'LOCKED'
            }
        });

        await prisma.emergencyControlAction.create({
            data: {
                tenantId: 'FETCH_FROM_CONN', // Placeholder
                actorId: userId,
                actionType: 'QUARANTINE',
                targetRef: connectionId,
                reason
            }
        });

        await AuditLogger.log({
            actorId: userId,
            action: 'QUARANTINE_TRIGGERED',
            targetRef: connectionId,
            status: 'SUCCESS',
            metadata: { reason }
        });
    }
}
