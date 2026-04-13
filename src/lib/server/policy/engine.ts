// Threat Policy Engine
// Evaluates security rules against proposed infrastructure changes or real-time events.

import { prisma } from '../db';
import { MfaService } from '../mfa';

export interface EvaluationContext {
    tenantId: string;
    userId: string;
    environment: string;
    action: string;
    resourceScope: string[];
    rawState: any;
}

export interface EvaluationResult {
    decision: 'ALLOW' | 'DENY' | 'MFA_REQUIRED' | 'APPROVAL_REQUIRED';
    findings: string[];
    remediation?: string;
}

export class PolicyEngine {
    /**
     * Evaluates a proposed orchestration against all active rules for the tenant.
     */
    static async evaluateOrchestration(context: EvaluationContext): Promise<EvaluationResult> {
        const rules = await prisma.threatRule.findMany({
            where: {
                tenantId: context.tenantId,
                enabled: true
            },
            include: {
                bundle: true
            }
        });

        const findings: string[] = [];
        let finalDecision: EvaluationResult['decision'] = 'ALLOW';

        for (const rule of rules) {
            // Scaffold: Simple categorical matching
            // In prod: run OPA (Open Policy Agent) rego or a custom JSON logic engine
            const isMatch = this.checkRuleMatch(rule, context);

            if (isMatch) {
                findings.push(`Rule ${rule.name} matched: ${rule.description}`);

                // Determine severity/decision. We pick the most restrictive.
                if (rule.severityDefault === 'CRITICAL') {
                    finalDecision = 'DENY';
                } else if (rule.severityDefault === 'HIGH' && finalDecision !== 'DENY') {
                    finalDecision = 'MFA_REQUIRED';
                } else if (rule.severityDefault === 'MEDIUM' && finalDecision === 'ALLOW') {
                    finalDecision = 'APPROVAL_REQUIRED';
                }
            }
        }

        return {
            decision: finalDecision,
            findings
        };
    }

    private static checkRuleMatch(rule: any, context: EvaluationContext): boolean {
        // Placeholder for real logic (e.g., checking if context.resourceScope contains assets in rule.assetScope)
        if (rule.category === 'NETWORK' && context.action === 'PROVISION_VPC') return true;
        if (rule.category === 'IDENTITY' && context.action === 'IAM_CREATE_ROLE') return true;
        return false;
    }
}
