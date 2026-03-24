// Audit Plane Scaffolding
// Handles append-oriented event logging for privileged actions, policy decisions, MFA events
import { EventBus } from '../events';

export type AuditAction =
    | 'USER_LOGIN'
    | 'MFA_CHALLENGE_VERIFIED'
    | 'CLOUD_CONNECTION_CREATED'
    | 'CLOUD_CONNECTION_ACTIVATED'
    | 'THREAT_POLICY_EVALUATED'
    | 'ORCHESTRATION_EXECUTED'
    | 'SECRET_SEALED'
    | 'SECRET_ACCESSED'
    | 'DIAGRAM_CREATED'
    | 'DIAGRAM_VERSION_SAVED'
    | 'DIAGRAM_RESTORED'
    | 'DEPLOYMENT_STARTED'
    | 'DEPLOYMENT_COMPLETED'
    | 'TERRAFORM_MANUALLY_EDITED';

export interface AuditRecord {
    tenantId?: string;
    actorId: string;
    action: AuditAction;
    targetRef?: string;
    status: 'SUCCESS' | 'FAILURE' | 'DENIED';
    reason?: string;
    correlationId?: string;
    metadata: Record<string, any>;
}

export class AuditLogger {
    /**
     * Records an append-only audit event.
     */
    static async log(record: AuditRecord): Promise<void> {
        // Emit to EventBus so secondary stores (ClickHouse/S3) can persist it async
        await EventBus.publish('audit', record, { source: 'AuditLogger' });

        // In Phase 1 we just scaffold this. Will be hooked to Prisma/Postgres or direct file writes later.
        console.log(`[AUDIT] [${record.status}] ${record.action} by ${record.actorId} (Target: ${record.targetRef})`);
    }
}
