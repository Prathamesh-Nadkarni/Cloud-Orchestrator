// Orchestration Execution Worker
// Synchronous/Asynchronous runner for infrastructure deployments.

import { randomUUID } from 'crypto';
import { PolicyEngine } from '../policy/engine';
import { AuditLogger } from '../audit';
import { MfaService } from '../mfa';
import { CloudConnectionService } from '../cloud-connections';
import { prisma } from '../db';

export interface ExecutionJob {
    id: string;
    tenantId: string;
    userId: string;
    connectionId: string;
    visualGraph: any;
    status: 'QUEUED' | 'POLICING' | 'EXECUTING' | 'COMPLETED' | 'FAILED' | 'BLOCKED_BY_POLICY' | 'MFA_PENDING' | 'APPROVAL_REQUIRED';
    type: 'TERRAFORM_APPLY' | 'DIRECT_API';
}

export class OrchestrationWorker {
    /**
     * Entry point for executing an orchestration plan.
     */
    static async submitExecution(params: {
        tenantId: string;
        userId: string;
        connectionId: string;
        visualGraph: any;
    }): Promise<{ jobId: string; status: string; findings?: string[]; challengeId?: string }> {

        const jobId = randomUUID();

        // 1. Policy Gate (PRE-FLIGHT)
        const policyResult = await PolicyEngine.evaluateOrchestration({
            tenantId: params.tenantId,
            userId: params.userId,
            environment: 'PRODUCTION_MOCK', // Resolve from connection
            action: 'ORCHESTRATE',
            resourceScope: [], // Extract from graph
            rawState: params.visualGraph
        });

        if (policyResult.decision === 'MFA_REQUIRED') {
            const challenge = await MfaService.createChallenge(params.userId, 'CLOUD_ACTIVATION');
            await AuditLogger.log({
                tenantId: params.tenantId,
                actorId: params.userId,
                action: 'MFA_CHALLENGE_CREATED',
                status: 'SUCCESS',
                targetRef: jobId,
                metadata: { challengeId: challenge.challengeId }
            });
            return { jobId, status: 'MFA_PENDING', challengeId: challenge.challengeId, findings: policyResult.findings };
        }

        if (policyResult.decision === 'APPROVAL_REQUIRED') {
            // In Phase 4, we added ApprovalService. Let's use it.
            return { jobId, status: 'APPROVAL_REQUIRED', findings: policyResult.findings };
        }

        if (policyResult.decision === 'DENY') {
            await AuditLogger.log({
                tenantId: params.tenantId,
                actorId: params.userId,
                action: 'ORCHESTRATION_BLOCKED',
                status: 'SUCCESS',
                targetRef: jobId,
                metadata: { findings: policyResult.findings }
            });
            return { jobId, status: 'BLOCKED_BY_POLICY', findings: policyResult.findings };
        }

        // 2. Queue for asynchronous execution
        this.runBackgroundTask(jobId, params);

        return { jobId, status: 'QUEUED' };
    }

    private static async runBackgroundTask(jobId: string, params: any) {
        console.log(`Starting background execution for job ${jobId}`);
        // Simulate execution delay
        setTimeout(async () => {
            await AuditLogger.log({
                tenantId: params.tenantId,
                actorId: params.userId,
                action: 'CLOUD_CONNECTION_ACTIVATED',
                status: 'SUCCESS',
                targetRef: jobId,
                metadata: { status: 'COMPLETED' }
            });
        }, 5000);
    }
}
