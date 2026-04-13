import { prisma } from '$lib/server/db';

export interface SecurityImpact {
    threatScoreDelta: number;
    mitigationLevel: number; // 0-100
    newAttackPaths: string[];
    blockedAttackPaths: string[];
    description: string;
}

export class VendorSecurityEngine {
    /**
     * Calculate the security impact of vendor products present on the canvas.
     */
    static async analyzeCanvasSecurity(nodes: any[], edges: any[]) {
        const vendorNodes = nodes.filter(n => n.type === 'vendor');
        const impacts: Record<string, SecurityImpact> = {};

        for (const node of vendorNodes) {
            const impact = await this.resolveNodeImpact(node);
            if (impact) {
                impacts[node.id] = impact;
            }
        }

        return impacts;
    }

    /**
     * Resolve security impact for a single vendor node.
     */
    private static async resolveNodeImpact(node: any): Promise<SecurityImpact | null> {
        const productId = node.data.productId;
        if (!productId) return null;

        // Fetch the security model for the latest published package
        const securityModel = await prisma.vendorSecurityModel.findFirst({
            where: {
                package: {
                    productId,
                    publishStatus: 'PUBLISHED'
                }
            },
            orderBy: {
                package: {
                    version: 'desc'
                }
            }
        });

        if (!securityModel) return null;

        const impactModel = securityModel.attackPathImpact as any;

        return {
            threatScoreDelta: impactModel?.threatScoreDelta || 0,
            mitigationLevel: impactModel?.mitigationLevel || 0,
            newAttackPaths: impactModel?.newAttackPaths || [],
            blockedAttackPaths: impactModel?.blockedAttackPaths || [],
            description: securityModel.description || 'Vendor security mitigation impact applied.'
        };
    }
}
