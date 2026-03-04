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

            // ═══════════════════════════════════════════════════════════════
            // VULNERABILITY DETECTION ENGINE — Comprehensive Rule Set
            // ═══════════════════════════════════════════════════════════════

            const srcLabel = currentNode?.data?.label || currentNode?.data?.type || "Unknown";
            const dstLabel = targetNode.data?.label || targetNode.data?.type || "Unknown";
            const srcType = currentNode?.data?.type || "";
            const dstType = targetNode.data?.type || "";
            const isFromExternal = srcType === "internet" || srcType === "onprem";
            const adminPorts = ["22", "3389", "5900", "23", "2222", "5985", "5986"];
            const dbPorts = ["3306", "5432", "1433", "1521", "27017", "6379", "9042", "5984"];

            // 1. Unencrypted traffic over internet or to sensitive targets
            if ((protocol === "http" || protocol === "tcp" || protocol === "telnet" || protocol === "ftp") &&
                (isFromExternal || dstType === "database" || dstType === "storage")) {
                vulnerabilities.push({
                    edgeId: edge.id,
                    title: "Unencrypted Data Flow",
                    description: `Data flowing from '${srcLabel}' to '${dstLabel}' uses unencrypted protocol (${protocol.toUpperCase()}). Use HTTPS or TLS to protect data in transit.`,
                    severity: "high",
                });
            }

            // 2. Direct Internet → Database / Storage
            if (srcType === "internet" && (dstType === "storage" || dstType === "database")) {
                vulnerabilities.push({
                    edgeId: edge.id,
                    title: "Direct Public Access to Storage/Database",
                    description: `Database/Storage node '${dstLabel}' is directly accessible from the internet. Place it behind a private subnet and access via application servers.`,
                    severity: "high"
                });
            }

            // 3. Admin/Management Ports Exposed to External Sources (SSH, RDP, VNC, Telnet)
            if (isFromExternal && adminPorts.includes(port)) {
                const portNames: Record<string, string> = { "22": "SSH", "3389": "RDP", "5900": "VNC", "23": "Telnet", "2222": "SSH-Alt", "5985": "WinRM-HTTP", "5986": "WinRM-HTTPS" };
                vulnerabilities.push({
                    edgeId: edge.id,
                    title: `${portNames[port] || "Admin"} Port Exposed to External Traffic`,
                    description: `Port ${port} (${portNames[port] || "admin service"}) on '${dstLabel}' is reachable from '${srcLabel}'. Restrict admin access to a bastion or VPN. Never expose management ports publicly.`,
                    severity: "high"
                });
            }

            // 4. Wildcard Port Exposure (port = "*" or "0-65535")
            if (port === "*" || port === "0-65535" || port === "any") {
                vulnerabilities.push({
                    edgeId: edge.id,
                    title: "Wildcard Port Exposure",
                    description: `All ports are open from '${srcLabel}' to '${dstLabel}'. This is extremely permissive. Restrict to only necessary ports (e.g., 443, 8080).`,
                    severity: "high"
                });
            }

            // 5. FTP Protocol Usage
            if (protocol === "ftp") {
                vulnerabilities.push({
                    edgeId: edge.id,
                    title: "Insecure FTP Protocol",
                    description: `FTP is inherently insecure (credentials sent in plaintext) between '${srcLabel}' and '${dstLabel}'. Use SFTP or SCP instead.`,
                    severity: "high"
                });
            }

            // 6. Telnet Protocol Usage
            if (protocol === "telnet") {
                vulnerabilities.push({
                    edgeId: edge.id,
                    title: "Insecure Telnet Protocol",
                    description: `Telnet sends all data including credentials in plaintext between '${srcLabel}' and '${dstLabel}'. Use SSH instead.`,
                    severity: "high"
                });
            }

            // 7. Database Ports Exposed from Internet
            if (isFromExternal && dbPorts.includes(port)) {
                vulnerabilities.push({
                    edgeId: edge.id,
                    title: "Database Port Exposed to External Network",
                    description: `Database port ${port} is accessible from '${srcLabel}'. Database services should never be directly exposed externally. Use a proxy, bastion, or application layer.`,
                    severity: "high"
                });
            }

            // 8. Cross-Cloud Unencrypted Traffic (different providers communicating without HTTPS/TLS)
            if (currentNode?.data?.provider && targetNode.data?.provider &&
                currentNode.data.provider !== targetNode.data.provider &&
                currentNode.data.provider !== "external" && targetNode.data.provider !== "external" &&
                currentNode.data.provider !== "aviatrix" && targetNode.data.provider !== "aviatrix" &&
                protocol !== "https" && protocol !== "tls" && protocol !== "grpc") {
                vulnerabilities.push({
                    edgeId: edge.id,
                    title: "Cross-Cloud Unencrypted Traffic",
                    description: `Traffic from '${srcLabel}' (${currentNode.data.provider.toUpperCase()}) to '${dstLabel}' (${targetNode.data.provider.toUpperCase()}) uses '${protocol.toUpperCase()}' without encryption. Cross-cloud traffic MUST be encrypted (use HTTPS, TLS, or IPsec tunnels).`,
                    severity: "high"
                });
            }

            // 9. Database Replication Over Unencrypted Channel
            if (srcType === "database" && dstType === "database" && protocol !== "https" && protocol !== "tls") {
                vulnerabilities.push({
                    edgeId: edge.id,
                    title: "Unencrypted Database Replication",
                    description: `Database replication between '${srcLabel}' and '${dstLabel}' uses '${protocol.toUpperCase()}'. Enable TLS/SSL for replication streams to protect data at rest in transit.`,
                    severity: "medium"
                });
            }

            // 10. Compute Node Without Subnet Isolation (no parentId = not inside a VPC/VNet/Subnet)
            if (dstType === "compute" && !targetNode.parentId) {
                vulnerabilities.push({
                    nodeId: targetNode.id,
                    title: "Compute Node Without Network Isolation",
                    description: `Compute node '${dstLabel}' is not placed inside any VPC, VNet, or Subnet. It should be nested inside a network boundary for proper security group and ACL enforcement.`,
                    severity: "medium"
                });
            }

            // 11. HTTP (port 80) when HTTPS (443) exists — unnecessary open insecure port
            if (port === "80" && protocol === "http") {
                vulnerabilities.push({
                    edgeId: edge.id,
                    title: "HTTP Port 80 Open — Use HTTPS Redirect",
                    description: `Port 80 (HTTP) is open from '${srcLabel}' to '${dstLabel}'. Consider enforcing HTTPS-only (port 443) and redirecting HTTP to HTTPS.`,
                    severity: "medium"
                });
            }

            // 12. Overly broad protocol ("all" or "any") usage
            if (protocol === "all" || protocol === "any") {
                vulnerabilities.push({
                    edgeId: edge.id,
                    title: "Overly Permissive Protocol Rule",
                    description: `The connection from '${srcLabel}' to '${dstLabel}' allows ALL protocols. This is a very broad rule. Restrict to specific protocols like TCP/443 or UDP/53.`,
                    severity: "medium"
                });
            }

            // Record edge natively as simulated before placing in queue
            simulatedEdges.add(edge.id);

            // Queue the next node
            queue.push({ nodeId: targetNode.id, path: [...path, edge] });
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // POST-TRAVERSAL STRUCTURAL CHECKS
    // ═══════════════════════════════════════════════════════════════

    // 13. Orphan Nodes — nodes with zero connections (no security rules defined at all)
    const connectedNodeIds = new Set<string>();
    edges.forEach(e => { connectedNodeIds.add(e.source); connectedNodeIds.add(e.target); });

    nodes.forEach(node => {
        const nType = node.data?.type || "";
        // Only flag compute, database, storage — skip containers like vpc/vnet/subnet
        if (["compute", "database", "storage", "kubernetes"].includes(nType) && !connectedNodeIds.has(node.id)) {
            vulnerabilities.push({
                nodeId: node.id,
                title: "Isolated Node — No Network Rules Defined",
                description: `'${node.data?.label || nType}' has no inbound or outbound network connections. This means no security/firewall rules are configured for it. Either connect it to the network or remove it.`,
                severity: "medium"
            });
        }
    });

    // 14. Database / Storage Without Parent Subnet
    nodes.forEach(node => {
        if ((node.data?.type === "database" || node.data?.type === "storage") && !node.parentId) {
            vulnerabilities.push({
                nodeId: node.id,
                title: "Database/Storage Without Network Boundary",
                description: `'${node.data?.label}' is not placed inside a VPC/VNet/Subnet. Sensitive data stores MUST be isolated within a private subnet with restricted access.`,
                severity: "high"
            });
        }
    });

    // 15. Internet Node Directly Inside a Private Subnet (misconfig)
    nodes.forEach(node => {
        if (node.data?.type === "internet" && node.parentId) {
            const parent = nodes.find(n => n.id === node.parentId);
            if (parent && (parent.data?.type === "subnet" || parent.data?.type === "vpc" || parent.data?.type === "vnet")) {
                vulnerabilities.push({
                    nodeId: node.id,
                    title: "Internet Gateway Misconfigured Inside Private Network",
                    description: `Internet node '${node.data?.label}' is nested inside '${parent.data?.label}'. Internet gateways should be external to VPCs/VNets, not inside subnets.`,
                    severity: "medium"
                });
            }
        }
    });

    return {
        vulnerabilities,
        simulatedEdges: Array.from(simulatedEdges),
        blockedEdges: Array.from(blockedEdges)
    };
}
