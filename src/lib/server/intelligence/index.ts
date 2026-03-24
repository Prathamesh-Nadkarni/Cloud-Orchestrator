// Intelligence Plane Service
// Handles heuristic analysis of the cloud graph, including exposure, utilization, and cost.

import { prisma } from '../db';

export interface Finding {
    id: string;
    type: 'ATTACK_PATH' | 'IDLE_RESOURCE' | 'OVER_PROVISIONED' | 'EXPOSED_PORT';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    title: string;
    description: string;
    affectedAssets: string[];
}

export class IntelligenceService {
    /**
     * Run heuristic checks against the asset graph.
     */
    static async runHeuristics(tenantId: string): Promise<Finding[]> {
        // In prod: Fetch the asset graph and run graph traversals
        // Scaffold: Return mock findings based on connections

        const connections = await prisma.cloudConnection.findMany({
            where: { tenantId }
        });

        const findings: Finding[] = [];

        // --- Phase 5: Marketplace Intelligence Hooks ---
        const { VendorSecurityEngine } = await import('../security/vendor-engine');
        // In a real scenario, we would parse the active diagram. 
        // For the mock, we simulate checking vendor presence.
        const vendorImpacts = await VendorSecurityEngine.analyzeCanvasSecurity([], []);
        const totalMitigation = Object.values(vendorImpacts).reduce((acc, imp) => acc + imp.mitigationLevel, 0);

        for (const conn of connections) {
            // Mock Attack Path
            if (totalMitigation < 80) { // If WAF node is present, mitigation would be high
                findings.push({
                    id: Math.random().toString(36).substring(7),
                    type: 'ATTACK_PATH',
                    severity: totalMitigation > 40 ? 'MEDIUM' : 'HIGH',
                    title: 'Potential Internet Exposure',
                    description: totalMitigation > 0
                        ? `Internet-facing VPC found, partially mitigated by vendor integrations.`
                        : `Internet-facing VPC found in connection ${conn.displayName} without WAF.`,
                    affectedAssets: ['vpc-0123456789']
                });
            }

            // Mock Idle Resource
            findings.push({
                id: Math.random().toString(36).substring(7),
                type: 'IDLE_RESOURCE',
                severity: 'LOW',
                title: 'Zombie Instance Found',
                description: 't3.large instance idle for > 30 days.',
                affectedAssets: ['i-0987654321']
            });
        }

        return findings;
    }

    /**
     * Generates overlay data for the visual UI (Utilization, Attack flows, etc.)
     */
    static async getTopologyOverlays(connectionId: string): Promise<any> {
        return {
            nodes: {
                'internet-gw': { risk: 0.9, trafficLabel: '1.2 Gbps' },
                'app-server': { utilization: 0.15, hotspot: false }
            },
            edges: {
                'public-to-app': { status: 'ALERT', latency: '45ms' }
            }
        };
    }
}
