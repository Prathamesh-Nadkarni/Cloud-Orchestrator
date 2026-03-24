import { NetworkProfiles } from '../config/networkProfiles';

export interface NodeData {
    id: string;
    type: string; // Generic canonical type
    data: {
        type?: string;
        provider?: string;
        size?: string;
        label?: string;
        [key: string]: any;

        // AI Workload Metadata
        dataSensitivity?: 'public' | 'internal' | 'confidential' | 'regulated';
        containsPII?: boolean;
        containsTrainingData?: boolean;
        containsPrompts?: boolean;
        containsEmbeddings?: boolean;
        internetReachable?: boolean;
        authMode?: 'none' | 'apiKey' | 'mTLS' | 'IAM' | 'OAuth';
        modelOrigin?: 'selfHosted' | 'managed' | 'external';
        egressRestricted?: boolean;
        loggingEnabled?: boolean;
        redactionEnabled?: boolean;
        guardrailEnabled?: boolean;
        humanApprovalRequired?: boolean;

        // Network Capacity Metadata
        expectedBandwidthMbps?: number;
        networkTier?: string;

        // Multicloud / Routing
        requiresHA?: boolean;
        bgpAsn?: number;
    };
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
        dcfAction?: string; // Legacy override

        // AI Traffic Metadata
        trafficClass?: 'inference' | 'training' | 'embedding' | 'sync' | 'admin' | 'telemetry';
        payloadType?: 'prompts' | 'embeddings' | 'modelWeights' | 'trainingData' | 'metadata';
        encrypted?: boolean;
        authenticated?: boolean;
        crossBoundary?: 'sameVPC' | 'crossVPC' | 'crossCloud' | 'internet';
        egressType?: 'internal' | 'externalAPI' | 'modelAPI' | 'publicInternet';

        // Capacity & Routing Metadata
        expectedBandwidthMbps?: number;
        peakBandwidthMbps?: number;
        trafficPattern?: 'steady' | 'bursty' | 'batch' | 'streaming' | 'replication';
        directionality?: 'ingress' | 'egress' | 'bidirectional';
        maxLatencyMs?: number;
        monthlyTransferGB?: number;
        routingProtocol?: 'static' | 'bgp' | 'ospf';
    };
}

export interface SimulationResult {
    vulnerabilities: Vulnerability[];
    simulatedEdges: string[];
    blockedEdges: string[];
}

export interface Vulnerability {
    edgeId?: string;
    nodeId?: string;
    category: 'network' | 'ai' | 'dcf' | 'isolation' | 'capacity' | 'compliance';
    title: string;
    description: string;
    severity: "high" | "medium" | "low" | "blocked";
    remediation?: string;
}

export interface SmartGroup {
    uuid: string;
    name: string;
    resourceType?: string;
    provider?: string;
    nameContains?: string;
    cidr?: string;
    tags?: Record<string, string>;
    environment?: string;
    criticality?: string;
    aiRole?: string;
    namespace?: string;
    cluster?: string;
    customLabels?: Record<string, string>;
    matchExpressions?: Array<{ type: string; operator: string; value: string }>;
}

export interface DCFPolicy {
    uuid: string;
    name: string;
    action: "ALLOW" | "DENY";
    priority?: number;
    protocol: string;
    port?: string;
    srcSmartGroups: string[];
    dstSmartGroups: string[];
    logging?: boolean;
    description?: string;
    stateful?: boolean;
    direction?: 'ingress' | 'egress' | 'both';
}

export interface ImportedDCF {
    smartGroups: SmartGroup[];
    policies: DCFPolicy[];
}

// -----------------------------------------------------------------------------
// Evaluators
// -----------------------------------------------------------------------------

function evaluateDCFRules(srcNode: NodeData, dstNode: NodeData, edge: EdgeData, dcf?: ImportedDCF, normalizedRules?: any[]): Vulnerability[] {
    const vulns: Vulnerability[] = [];

    const protocol = (edge.data.protocol || "any").toLowerCase();
    const port = edge.data.port || "any";

    const getMatchingGroups = (node: NodeData) => {
        const matchedGroups: string[] = [];

        // 1. Legacy SmartGroups
        if (dcf) {
            for (const sg of dcf.smartGroups) {
                const matches = (sg.matchExpressions || []).every(expr => {
                    if (expr.type === 'nodeType' && expr.operator === 'equals') return node.data.type === expr.value;
                    if (expr.type === 'nodeName' && expr.operator === 'equals') return node.data.label === expr.value;
                    if (expr.type === 'nodeName' && expr.operator === 'contains') return node.data.label?.includes(expr.value);
                    return false;
                });
                if (matches) matchedGroups.push(sg.name);
            }
        }
        return matchedGroups;
    };

    const srcGroups = getMatchingGroups(srcNode);
    const dstGroups = getMatchingGroups(dstNode);

    // 1. Evaluate Normalized Rules (New Engine) - First Match Wins
    if (normalizedRules && normalizedRules.length > 0) {
        for (const rule of normalizedRules) {
            const srcValues = rule.srcMatch?.values || [];
            const dstValues = rule.dstMatch?.values || [];

            const srcMatch = srcValues.includes("ANY") || srcValues.includes("*") ||
                srcValues.some((v: any) => srcGroups.includes(v) || srcNode.data.label === v || srcNode.data.type === v);

            const dstMatch = dstValues.includes("ANY") || dstValues.includes("*") ||
                dstValues.some((v: any) => dstGroups.includes(v) || dstNode.data.label === v || dstNode.data.type === v);

            const protocolMatch = rule.protocol.toLowerCase() === "any" || rule.protocol.toLowerCase() === protocol;
            const portMatch = rule.ports.length === 0 || rule.ports.includes(parseInt(port)) || port === "any" || port === "*";

            if (srcMatch && dstMatch && protocolMatch && portMatch) {
                if (rule.action === "DENY") {
                    vulns.push({
                        edgeId: edge.id,
                        category: 'dcf',
                        title: `Blocked by DCF Rule: ${rule.name}`,
                        description: `Rule '${rule.name}' (Priority ${rule.priority}) denied traffic from ${srcNode.data.label} to ${dstNode.data.label}.`,
                        severity: "blocked"
                    });
                }
                return vulns; // deterministic: first match wins
            }
        }
    }

    // 2. Fallback to Legacy Policies
    if (dcf && dcf.policies.length > 0) {
        for (const policy of dcf.policies) {
            const srcMatch = policy.srcSmartGroups.includes("ANY") || policy.srcSmartGroups.some(g => srcGroups.includes(g));
            const dstMatch = policy.dstSmartGroups.includes("ANY") || policy.dstSmartGroups.some(g => dstGroups.includes(g));
            const protocolMatch = policy.protocol.toLowerCase() === "any" || policy.protocol.toLowerCase() === protocol;
            const portMatch = (policy.port || "any").toLowerCase() === "any" || policy.port === port;

            if (srcMatch && dstMatch && protocolMatch && portMatch) {
                if (policy.action === "DENY") {
                    vulns.push({
                        edgeId: edge.id,
                        category: 'dcf',
                        title: `Blocked by DCF Policy: ${policy.name}`,
                        description: `Policy '${policy.name}' dropped traffic from ${srcNode.data.label || srcNode.data.type} to ${dstNode.data.label || dstNode.data.type}.`,
                        severity: "blocked"
                    });
                }
                break;
            }
        }
    }
    return vulns;
}

function evaluateNetworkRules(srcNode: NodeData, dstNode: NodeData, edge: EdgeData): Vulnerability[] {
    const vulns: Vulnerability[] = [];
    const protocol = (edge.data.protocol || "any").toLowerCase();
    const port = edge.data.port || "any";
    const srcLabel = srcNode.data.label || srcNode.data.type || "Unknown";
    const dstLabel = dstNode.data.label || dstNode.data.type || "Unknown";
    const srcType = srcNode.data.type || "";
    const dstType = dstNode.data.type || "";
    const isFromExternal = srcType === "internet" || srcType === "onprem";
    const adminPorts = ["22", "3389", "5900", "23", "2222", "5985", "5986"];
    const dbPorts = ["3306", "5432", "1433", "1521", "27017", "6379", "9042", "5984"];

    if ((protocol === "http" || protocol === "tcp" || protocol === "telnet" || protocol === "ftp") &&
        (isFromExternal || dstType === "database" || dstType === "storage")) {
        vulns.push({ edgeId: edge.id, category: 'network', title: "Unencrypted Data Flow", description: `Data flowing from '${srcLabel}' to '${dstLabel}' uses unencrypted protocol (${protocol.toUpperCase()}). Use HTTPS or TLS.`, severity: "high" });
    }

    if (srcType === "internet" && (dstType === "storage" || dstType === "database")) {
        vulns.push({ edgeId: edge.id, category: 'network', title: "Direct Public Access to Storage/Database", description: `Database/Storage node '${dstLabel}' is directly accessible from the internet.`, severity: "high" });
    }

    if (isFromExternal && adminPorts.includes(port)) {
        vulns.push({ edgeId: edge.id, category: 'network', title: `Admin Port ${port} Exposed Externally`, description: `Restric admin access.`, severity: "high" });
    }

    if (port === "*" || port === "0-65535" || port === "any") {
        vulns.push({ edgeId: edge.id, category: 'network', title: "Wildcard Port Exposure", description: `All ports open from '${srcLabel}' to '${dstLabel}'.`, severity: "high" });
    }

    if (isFromExternal && dbPorts.includes(port)) {
        vulns.push({ edgeId: edge.id, category: 'network', title: "Database Port Exposed", description: `Database port ${port} is directly accessible externally.`, severity: "high" });
    }

    if (srcNode.data.provider && dstNode.data.provider && srcNode.data.provider !== dstNode.data.provider && srcNode.data.provider !== "external" && dstNode.data.provider !== "external" && srcNode.data.provider !== "aviatrix" && dstNode.data.provider !== "aviatrix" && protocol !== "https" && protocol !== "tls" && protocol !== "grpc") {
        vulns.push({ edgeId: edge.id, category: 'network', title: "Cross-Cloud Unencrypted Traffic", description: `Cross-cloud traffic MUST be encrypted.`, severity: "high" });
    }

    return vulns;
}

function evaluateStructuralRules(nodes: NodeData[], edges: EdgeData[]): Vulnerability[] {
    const vulns: Vulnerability[] = [];
    const connectedNodeIds = new Set<string>();
    edges.forEach(e => { connectedNodeIds.add(e.source); connectedNodeIds.add(e.target); });

    nodes.forEach(node => {
        const nType = node.data.type || "";
        if (["compute", "database", "storage", "kubernetes"].includes(nType) && !connectedNodeIds.has(node.id)) {
            vulns.push({ nodeId: node.id, category: 'isolation', title: "Isolated Node", description: `'${node.data.label || nType}' has no network rules.`, severity: "medium" });
        }
        if ((nType === "database" || nType === "storage") && !node.parentId) {
            vulns.push({ nodeId: node.id, category: 'isolation', title: "Database/Storage Without Network Boundary", description: `Sensitive data stores MUST be isolated within a private subnet.`, severity: "high" });
        }
        if (nType === "compute" && !node.parentId) {
            vulns.push({ nodeId: node.id, category: 'isolation', title: "Compute Node Without Network Isolation", description: `Compute node is not inside a VPC/VNet/Subnet.`, severity: "medium" });
        }
        if (nType === "internet" && node.parentId) {
            const parent = nodes.find(n => n.id === node.parentId);
            if (parent && ["subnet", "vpc", "vnet"].includes(parent.data.type || "")) {
                vulns.push({ nodeId: node.id, category: 'isolation', title: "Internet Gateway Misconfigured Inside Private Network", description: `Internet gateways should be external to VPCs/VNets.`, severity: "medium" });
            }
        }
    });
    return vulns;
}

function evaluateAIRules(srcNode: NodeData, dstNode: NodeData, edge: EdgeData): Vulnerability[] {
    const vulns: Vulnerability[] = [];
    const srcType = srcNode.data.type || "";
    const dstType = dstNode.data.type || "";
    const isFromExternal = srcType === "internet" || srcType === "onprem";

    // Unauthenticated Public Model
    if (isFromExternal && dstType === "modelServing" && dstNode.data.authMode === "none") {
        vulns.push({ edgeId: edge.id, category: 'ai', title: "Public Model Endpoint Without Auth", description: `Model serving endpoint is publicly reachable without authentication.`, severity: "high" });
    }

    // Prompt Flow to External Model without Redaction
    if (edge.data.payloadType === "prompts" && dstType === "externalModelAPI" && !srcNode.data.redactionEnabled) {
        vulns.push({ edgeId: edge.id, category: 'ai', title: "Prompts to External API Without Redaction", description: `Sending prompts to an external API without redaction could leak PII.`, severity: "high" });
    }

    // Vector DB Exposed to Broad Compute / Internet
    if (dstType === "vectorDB" && (isFromExternal || srcType !== "embeddingService")) {
        vulns.push({ edgeId: edge.id, category: 'ai', title: "Vector DB Overly Exposed", description: `Vector DB should only be reachable by authorized embedding or orchestrator services.`, severity: "high" });
    }

    // Training Data Exposed
    if (dstType === "featureStore" && isFromExternal) {
        vulns.push({ edgeId: edge.id, category: 'ai', title: "Training Data Exposed to Internet", description: `Feature store is reachable from the public internet.`, severity: "high" });
    }

    // Unencrypted Prompts/Embeddings
    if ((edge.data.payloadType === "prompts" || edge.data.payloadType === "embeddings") && (edge.data.protocol === "http" || edge.data.protocol === "tcp")) {
        vulns.push({ edgeId: edge.id, category: 'ai', title: "Sensitive AI Traffic Unencrypted", description: `Prompts or embeddings are transferred without TLS/HTTPS.`, severity: "high" });
    }

    return vulns;
}

function evaluateCapacityRules(srcNode: NodeData, dstNode: NodeData, edge: EdgeData): Vulnerability[] {
    const vulns: Vulnerability[] = [];
    const expectedBw = edge.data.expectedBandwidthMbps || 0;
    const maxLatency = edge.data.maxLatencyMs || Infinity;
    const monthlyData = edge.data.monthlyTransferGB || 0;
    const isCrossCloud = srcNode.data.provider && dstNode.data.provider && srcNode.data.provider !== dstNode.data.provider;

    // Simulate checks pulling from capacity estimates
    if (expectedBw > 10000 && (srcNode.data.size?.includes("micro") || srcNode.data.size?.includes("small"))) {
        vulns.push({ edgeId: edge.id, category: 'capacity', title: "Bandwidth Exceeds Node Capability", description: `Edge expected bandwidth (${expectedBw} Mbps) likely saturates small node instances.`, severity: "medium" });
    }

    if (isCrossCloud && expectedBw > 1000) {
        vulns.push({ edgeId: edge.id, category: 'capacity', title: "High Cross-Cloud Data Transfer", description: `Cross cloud traffic of ${expectedBw} Mbps may incur high egress costs.`, severity: "medium" });
    }

    // Multicloud Latency SLA Constraints
    if (isCrossCloud && maxLatency < 20) {
        vulns.push({ edgeId: edge.id, category: 'capacity', title: "Unattainable Latency SLA", description: `Cross-cloud links rarely achieve sub-20ms latency stably (${maxLatency}ms requested).`, severity: "high" });
    }

    // Multicloud Egress Transfer Volumes
    if (isCrossCloud && monthlyData > 5000) {
        vulns.push({ edgeId: edge.id, category: 'capacity', title: "Massive Cross-Cloud Egress Costs", description: `Expected monthly transfer of ${monthlyData}GB across CSP boundaries will drive significant billing overages.`, severity: "high" });
    }

    // Multicloud Routing Constraints
    if (edge.data.routingProtocol === "static" && (expectedBw > 5000 || monthlyData > 10000)) {
        vulns.push({ edgeId: edge.id, category: 'network', title: "Static Routing Limits", description: `Static routing is suboptimal for high throughput (${expectedBw} Mbps). Strongly consider BGP.`, severity: "medium" });
    }

    // Node HA Warning
    if (srcNode.data.requiresHA && (!srcNode.data.size?.includes("large") && !srcNode.data.type?.includes("kubernetes"))) {
        vulns.push({ nodeId: srcNode.id, category: 'capacity', title: "HA Configuration Risk", description: `Node requests HA but may not be distributed or sized appropriately.`, severity: "medium" });
    }

    return vulns;
}

export function simulateDataFlow(nodes: NodeData[], edges: EdgeData[], importedDCF?: ImportedDCF, normalizedRules?: any[]): SimulationResult {
    const vulnerabilities: Vulnerability[] = [];
    const simulatedEdges = new Set<string>();
    const blockedEdges = new Set<string>();

    const adjList: Record<string, EdgeData[]> = {};
    nodes.forEach((n) => { adjList[n.id] = []; });
    edges.forEach((e) => {
        if (!adjList[e.source]) adjList[e.source] = [];
        adjList[e.source].push(e);
    });

    let queue: { nodeId: string; path: EdgeData[] }[] = [];
    const visitedEdges = new Set<string>();

    nodes.forEach((node) => queue.push({ nodeId: node.id, path: [] }));

    while (queue.length > 0) {
        const { nodeId, path } = queue.shift()!;
        path.forEach((e) => simulatedEdges.add(e.id));
        const currentNode = nodes.find(n => n.id === nodeId);
        const outgoingEdges = adjList[nodeId] || [];

        for (const edge of outgoingEdges) {
            if (visitedEdges.has(edge.id)) continue;
            visitedEdges.add(edge.id);
            const targetNode = nodes.find((n) => n.id === edge.target);
            if (!targetNode || !currentNode) continue;

            const dcfVulns = evaluateDCFRules(currentNode, targetNode, edge, importedDCF, normalizedRules);
            let trafficBlocked = false;

            if (dcfVulns.length > 0) {
                blockedEdges.add(edge.id);
                simulatedEdges.add(edge.id);
                vulnerabilities.push(...dcfVulns);
                trafficBlocked = true;
            }

            if (!trafficBlocked && edge.data?.dcfAction === "deny") {
                blockedEdges.add(edge.id);
                vulnerabilities.push({ edgeId: edge.id, category: 'dcf', title: "Traffic Blocked by Manual DCF Assignment", description: `Dropped traffic from ${currentNode.data.label} to ${targetNode.data.label}.`, severity: "blocked" });
                simulatedEdges.add(edge.id);
                trafficBlocked = true;
            }

            if (trafficBlocked) continue;

            vulnerabilities.push(...evaluateNetworkRules(currentNode, targetNode, edge));
            vulnerabilities.push(...evaluateAIRules(currentNode, targetNode, edge));
            vulnerabilities.push(...evaluateCapacityRules(currentNode, targetNode, edge));

            simulatedEdges.add(edge.id);
            queue.push({ nodeId: targetNode.id, path: [...path, edge] });
        }
    }

    vulnerabilities.push(...evaluateStructuralRules(nodes, edges));

    return {
        vulnerabilities,
        simulatedEdges: Array.from(simulatedEdges),
        blockedEdges: Array.from(blockedEdges)
    };
}
