// Approval Workflow Service
// Manages the creation, assignment, and decision-making for privileged actions.

import { prisma } from '../db';
import { AuditLogger } from '../audit';
import { NotificationService } from '../notifications';

export class ApprovalService {
    /**
     * Creates a new approval request for a sensitive action.
     */
    static async createRequest(params: {
        tenantId: string;
        userId: string;
        type: string;
        reason: string;
        connectionId?: string;
        workflowId?: string;
        ttlSeconds?: number;
        requiredApproverCount?: number;
    }): Promise<string> {

        const expiresAt = new Date(Date.now() + (params.ttlSeconds || 3600) * 1000);

        const request = await prisma.approvalRequest.create({
            data: {
                tenantId: params.tenantId,
                userId: params.userId,
                type: params.type,
                reason: params.reason,
                connectionId: params.connectionId,
                workflowId: params.workflowId,
                status: 'PENDING',
                expiresAt,
                requiredApproverCount: params.requiredApproverCount || 1,
            }
        });

        await AuditLogger.log({
            tenantId: params.tenantId,
            actorId: params.userId,
            action: 'APPROVAL_REQUEST_CREATED',
            targetRef: request.id,
            status: 'SUCCESS',
            metadata: { type: params.type, reason: params.reason }
        });

        // Notify administrators / security team
        await NotificationService.send({
            userId: 'SYSTEM_ADMIN_PLACEHOLDER', // In prod: resolve from ApprovalPolicy
            type: 'APPROVAL_REQUIRED',
            title: 'Action Approval Required',
            body: `Approval requested for ${params.type}: ${params.reason}`,
            metadata: { requestId: request.id }
        });

        return request.id;
    }

    /**
     * Records a decision (Approve/Reject) on a request.
     */
    static async submitDecision(
        requestId: string,
        approverId: string,
        decision: 'APPROVED' | 'REJECTED',
        notes?: string
    ): Promise<void> {

        const request = await prisma.approvalRequest.findUnique({
            where: { id: requestId },
            include: { decisions: true }
        });

        if (!request || request.status !== 'PENDING') {
            throw new Error('Approval request is not in a pending state.');
        }

        // Record the individual decision
        await prisma.approvalDecision.create({
            data: {
                requestId,
                userId: approverId,
                decision,
                notes
            }
        });

        if (decision === 'REJECTED') {
            await prisma.approvalRequest.update({
                where: { id: requestId },
                data: { status: 'REJECTED', decidedAt: new Date(), decisionNotes: notes }
            });
        } else {
            // Check if we met the required count
            const approvedCount = request.decisions.filter(d => d.decision === 'APPROVED').length + 1;

            if (approvedCount >= request.requiredApproverCount) {
                await prisma.approvalRequest.update({
                    where: { id: requestId },
                    data: { status: 'APPROVED', decidedAt: new Date(), decisionNotes: notes }
                });

                // Trigger completion callback if applicable (e.g. unquarantine)
            }
        }

        await AuditLogger.log({
            tenantId: request.tenantId,
            actorId: approverId,
            action: 'APPROVAL_DECISION_SUBMITTED',
            targetRef: requestId,
            status: 'SUCCESS',
            metadata: { decision, count: request.decisions.length + 1 }
        });
    }
}
