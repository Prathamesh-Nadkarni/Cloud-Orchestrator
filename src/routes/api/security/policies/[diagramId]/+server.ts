import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/db';
import { FirewallEngine } from '$lib/server/security/firewallEngine';

/**
 * GET /api/security/policies/[diagramId]
 * Get the security policy and sorted rules for a diagram.
 */
export async function GET({ params }: any) {
    const { diagramId } = params;

    try {
        let policy = await prisma.securityPolicy.findUnique({
            where: { diagramId },
            include: { rules: true }
        });

        if (!policy) {
            // Create a default empty policy if none exists
            const diagram = await prisma.infrastructureDiagram.findUnique({ where: { id: diagramId } });
            if (!diagram) return json({ error: 'Diagram not found' }, { status: 404 });

            policy = await prisma.securityPolicy.create({
                data: {
                    diagramId,
                    tenantId: diagram.tenantId,
                    name: `Policy for ${diagram.name}`,
                },
                include: { rules: true }
            });
        }

        // Sort rules using the engine
        const sortedRules = FirewallEngine.sortRules(policy.rules as any);
        const validation = FirewallEngine.validatePolicy(policy.rules as any);

        return json({
            policy,
            sortedRules,
            validation: Object.fromEntries(validation)
        });
    } catch (e: any) {
        return json({ error: e.message }, { status: 500 });
    }
}

/**
 * POST /api/security/policies/[diagramId]/rules
 * Add or update a rule.
 */
export async function POST({ params, request }: any) {
    const { diagramId } = params;
    const ruleData = await request.json();

    try {
        const policy = await prisma.securityPolicy.findUnique({ where: { diagramId } });
        if (!policy) return json({ error: 'Policy not found' }, { status: 404 });

        const rule = await prisma.firewallRule.upsert({
            where: { id: ruleData.id || 'new-id' },
            update: {
                name: ruleData.name,
                priority: ruleData.priority,
                layer: ruleData.layer,
                action: ruleData.action,
                protocol: ruleData.protocol,
                ports: ruleData.ports,
                srcMatch: ruleData.srcMatch,
                dstMatch: ruleData.dstMatch,
                isWildcard: ruleData.isWildcard,
                description: ruleData.description,
            },
            create: {
                policyId: policy.id,
                name: ruleData.name,
                priority: ruleData.priority,
                layer: ruleData.layer,
                action: ruleData.action,
                protocol: ruleData.protocol,
                ports: ruleData.ports,
                srcMatch: ruleData.srcMatch,
                dstMatch: ruleData.dstMatch,
                isWildcard: ruleData.isWildcard,
                description: ruleData.description,
            }
        });

        return json(rule);
    } catch (e: any) {
        return json({ error: e.message }, { status: 500 });
    }
}
