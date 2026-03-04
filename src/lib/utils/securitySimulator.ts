export interface NodeData {
    id: string;
    type: string;
    data: any;
    parentId?: string;
    position?: { x: number; y: number };
}

export interface EdgeData {
    id: string;
    source: string;
    target: string;
    data: {
        protocol?: string;
        port?: string;
        dcfAction?: string; // e.g. "allow", "deny", "none"
    };
}

export interface SimulationResult {
    vulnerabilities: Vulnerability[];
    simulatedEdges: string[]; // Edges that show the data flow / provenance
    blockedEdges: string[]; // Edges where traffic was blocked by DCF
}

export interface Vulnerability {
    edgeId?: string;
    nodeId?: string;
    title: string;
    description: string;
    severity: "high" | "medium" | "low";
}

export interface SmartGroup {
    name: string;
    matchExpressions: Array<{ type: string; operator: string; value: string }>;
}

export interface DCFPolicy {
    name: string;
    action: "ALLOW" | "DENY";
    protocol: string; // e.g., "TCP", "UDP", "ANY"
    port: string; // e.g., "80", "443", "ANY"
    srcSmartGroups: string[];
    dstSmartGroups: string[];
}

export interface ImportedDCF {
    smartGroups: SmartGroup[];
    policies: DCFPolicy[];
}

/**
 * Simulates data flow starting from internet nodes, finding paths through the network.
 * Analyzes the graph for common vulnerabilities.
 */
export function simulateDataFlow(
    nodes: NodeData[],
    edges: EdgeData[],
    importedDCF?: ImportedDCF
): SimulationResult {
    const vulnerabilities: Vulnerability[] = [];
    const simulatedEdges = new Set<string>();
    const blockedEdges = new Set<string>();

    // Create an adjacency list for easier traversal
    const adjList: Record<string, EdgeData[]> = {};
    nodes.forEach((n) => { adjList[n.id] = []; });

    edges.forEach((e) => {
        if (!adjList[e.source]) adjList[e.source] = [];
        adjList[e.source].push(e);
    });

    // Basic graph traversal to find data flow paths and uncover vulnerabilities
    let queue: { nodeId: string; path: EdgeData[] }[] = [];
    const visitedEdges = new Set<string>();

    // Initialize queue with all nodes to ensure no isolated subgraphs are missed
    nodes.forEach((node) => {
        queue.push({ nodeId: node.id, path: [] });
    });

    while (queue.length > 0) {
        const { nodeId, path } = queue.shift()!;

        // Add the path that led here to simulatedEdges
        path.forEach((e) => simulatedEdges.add(e.id));

        const currentNode = nodes.find(n => n.id === nodeId);

        // Check outgoing edges from this node
        const outgoingEdges = adjList[nodeId] || [];

        for (const edge of outgoingEdges) {
            // Prevent infinite loops by blocking edge revisits instead of node revisits
            if (visitedEdges.has(edge.id)) continue;
            visitedEdges.add(edge.id);
            const targetNode = nodes.find((n) => n.id === edge.target);
            if (!targetNode) continue;

            const protocol = edge.data?.protocol?.toLowerCase() || "any";
            const port = edge.data?.port || "any";
            let trafficBlocked = false;

            // DCF Policy Enforcement (Imported JSON Evaluator)
            if (importedDCF && importedDCF.policies.length > 0) {
                // Determine matching smartgroups for Source and Destination Nodes
                const getMatchingGroups = (node: NodeData) => {
                    const matchedGroups: string[] = [];
                    for (const sg of importedDCF.smartGroups) {
                        const matches = sg.matchExpressions.every(expr => {
                            if (expr.type === 'nodeType' && expr.operator === 'equals') return node.data?.type === expr.value;
                            if (expr.type === 'nodeName' && expr.operator === 'equals') return node.data?.label === expr.value;
                            if (expr.type === 'nodeName' && expr.operator === 'contains') return node.data?.label?.includes(expr.value);
                            return false;
                        });
                        if (matches) matchedGroups.push(sg.name);
                    }
                    return matchedGroups;
                };

                const srcGroups = getMatchingGroups(currentNode!);
                const dstGroups = getMatchingGroups(targetNode);

                // Sequential Policy Evaluation
                for (const policy of importedDCF.policies) {
                    const srcMatch = policy.srcSmartGroups.includes("ANY") || policy.srcSmartGroups.some(g => srcGroups.includes(g));
                    const dstMatch = policy.dstSmartGroups.includes("ANY") || policy.dstSmartGroups.some(g => dstGroups.includes(g));

                    const protocolMatch = policy.protocol.toLowerCase() === "any" || policy.protocol.toLowerCase() === protocol;
                    const portMatch = policy.port.toLowerCase() === "any" || policy.port === port;

                    if (srcMatch && dstMatch && protocolMatch && portMatch) {
                        if (policy.action === "DENY") {
                            blockedEdges.add(edge.id);
                            vulnerabilities.push({
                                edgeId: edge.id,
                                title: `Traffic Blocked by Imported DCF Policy: ${policy.name}`,
                                description: `Policy '${policy.name}' dropped traffic from ${currentNode?.data?.label || currentNode?.data?.type} to ${targetNode.data?.label || targetNode.data?.type}.`,
                                severity: "low"
                            });
                            simulatedEdges.add(edge.id);
                            trafficBlocked = true;
                        } else if (policy.action === "ALLOW") {
                            // Explicitly allowed, meaning we skip checking the basic edge properties.
                            // However, we let the structural checks (like Unencrypted Flow) still fire for reporting reasons.
                        }
                        break; // Stop evaluating policies once the *first* match is hit
                    }
                }
            }

            // DCF Policy Enforcement (Edge Level override from Canvas)
            if (!trafficBlocked && edge.data?.dcfAction === "deny") {
                blockedEdges.add(edge.id);
                vulnerabilities.push({
                    edgeId: edge.id,
                    title: "Traffic Blocked by Manual DCF Assignment",
                    description: `Aviatrix Distributed Cloud Firewall dynamically dropped traffic from ${currentNode?.data?.label || currentNode?.data?.type} to ${targetNode.data?.label || targetNode.data?.type}.`,
                    severity: "low"
                });
                simulatedEdges.add(edge.id);
                trafficBlocked = true;
            }

            if (trafficBlocked) {
                continue; // STOP TRAVERSAL
            }

            // 1. Unencrypted traffic over internet or across major boundaries
            if ((protocol === "http" || protocol === "tcp") && (currentNode?.data?.type === "internet" || targetNode.data?.type === "database")) {
                vulnerabilities.push({
                    edgeId: edge.id,
                    title: "Unencrypted Data Flow",
                    description: `Data flowing from ${currentNode?.data?.label || currentNode?.data?.type} to ${targetNode.data?.label || targetNode.data?.type} uses unencrypted protocol (${protocol}). Use HTTPS or TLS.`,
                    severity: "high",
                });
            }

            // 2. Direct Internet to Database access
            if (currentNode?.data?.type === "internet" && (targetNode.data?.type === "storage" || targetNode.data?.type === "database")) {
                vulnerabilities.push({
                    edgeId: edge.id,
                    title: "Direct Public Access to Storage/Database",
                    description: `Database/Storage node '${targetNode.data?.label}' is directly accessible from the internet. It should be behind a private subnet and accessed via application servers.`,
                    severity: "high"
                });
            }

            // 3. Permissive Ports (e.g. *, 0-65535, or SSH 22 open to internet)
            if ((currentNode?.data?.type === "internet" || currentNode?.data?.type === "onprem") && (edge.data?.port === "*" || edge.data?.port === "22")) {
                vulnerabilities.push({
                    edgeId: edge.id,
                    title: "Overly Permissive Inbound Traffic",
                    description: `Traffic from external source is allowed on port ${edge.data?.port}. This exposes the node to broad attacks. Restrict ports to necessary services (e.g., 443).`,
                    severity: "high"
                });
            }

            // Record edge natively as simulated before placing in queue
            simulatedEdges.add(edge.id);

            // Queue the next node
            queue.push({ nodeId: targetNode.id, path: [...path, edge] });
        }
    }

    return {
        vulnerabilities,
        simulatedEdges: Array.from(simulatedEdges),
        blockedEdges: Array.from(blockedEdges)
    };
}
