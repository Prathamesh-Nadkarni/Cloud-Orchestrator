/**
 * Intelligent Product Suggestion Engine
 * Analyzes architecture and recommends security products to fill gaps
 */

import { SECURITY_VENDORS } from '$lib/blockly/security-vendors';
import { SECURITY_INTEGRATION_RULES } from '$lib/security/integration-rules';

export interface ProductSuggestion {
  productKey: string;
  productName: string;
  vendor: string;
  category: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  reason: string;
  affectedResources: string[];
  placement: {
    type: 'external' | 'inside_vpc' | 'cluster-level';
    position?: { x: number; y: number };
    parentId?: string;
  };
  autoConfig?: any;
}

interface ArchitectureAnalysis {
  hasCompute: boolean;
  hasKubernetes: boolean;
  hasDatabase: boolean;
  hasStorage: boolean;
  hasMultiCloud: boolean;
  hasInternet: boolean;
  cloudProviders: string[];
  missingCapabilities: string[];
  existingProducts: Set<string>;
  vulnerabilities: string[];
}

/**
 * Analyze architecture and generate product suggestions
 */
export function generateProductSuggestions(nodes: any[], edges: any[]): ProductSuggestion[] {
  const analysis = analyzeArchitecture(nodes, edges);
  const suggestions: ProductSuggestion[] = [];

  // Critical: Cloud Security Posture Management (CSPM)
  if (!analysis.existingProducts.has('prisma_cloud') && 
      !analysis.existingProducts.has('wiz') && 
      !analysis.existingProducts.has('defender')) {
    
    if (analysis.cloudProviders.includes('azure')) {
      suggestions.push({
        productKey: 'defender',
        productName: 'Microsoft Defender for Cloud',
        vendor: 'Microsoft',
        category: 'CNAPP',
        priority: 'critical',
        reason: 'Azure resources detected without CSPM. Defender for Cloud provides native Azure security posture management.',
        affectedResources: nodes.filter(n => n.data.provider === 'azure').map(n => n.id),
        placement: {
          type: 'external',
          position: { x: 1200, y: 150 }
        },
        autoConfig: {
          protectedResources: nodes.filter(n => n.data.provider === 'azure' && n.data.type === 'compute').map(n => n.id),
          jitAccess: true,
          autoProvisioning: true
        }
      });
    } else if (analysis.hasMultiCloud) {
      suggestions.push({
        productKey: 'prisma_cloud',
        productName: 'Prisma Cloud',
        vendor: 'Palo Alto Networks',
        category: 'CNAPP',
        priority: 'critical',
        reason: 'Multi-cloud deployment detected. Prisma Cloud provides unified security posture across AWS, Azure, and GCP.',
        affectedResources: nodes.filter(n => ['aws', 'azure', 'gcp'].includes(n.data.provider)).map(n => n.id),
        placement: {
          type: 'external',
          position: { x: 1200, y: 150 }
        },
        autoConfig: {
          connectedAccounts: analysis.cloudProviders,
          apiCredentials: 'vault://prisma/api-key'
        }
      });
    } else {
      suggestions.push({
        productKey: 'wiz',
        productName: 'Wiz',
        vendor: 'Wiz',
        category: 'CNAPP',
        priority: 'critical',
        reason: 'Cloud resources need security scanning. Wiz provides agentless vulnerability and attack path analysis.',
        affectedResources: nodes.filter(n => ['aws', 'azure', 'gcp'].includes(n.data.provider)).map(n => n.id),
        placement: {
          type: 'external',
          position: { x: 1200, y: 150 }
        },
        autoConfig: {
          connectedAccounts: analysis.cloudProviders,
          snapshotEncryption: true,
          attackPathAnalysis: true
        }
      });
    }
  }

  // Critical: Endpoint Protection (if compute exists)
  if (analysis.hasCompute && !analysis.existingProducts.has('crowdstrike')) {
    const computeNodes = nodes.filter(n => n.data.type === 'compute' || n.data.type === 'kubernetes');
    const targetVpc = findParentVpc(computeNodes[0], nodes);
    suggestions.push({
      productKey: 'crowdstrike',
      productName: 'CrowdStrike Falcon',
      vendor: 'CrowdStrike',
      category: 'Endpoint',
      priority: 'critical',
      reason: `${computeNodes.length} compute instance(s) detected without endpoint protection. CrowdStrike provides EDR and threat detection.`,
      affectedResources: computeNodes.map(n => n.id),
      placement: {
        type: 'inside_vpc',
        parentId: targetVpc?.id,
        position: { x: 1200, y: 400 }
      },
      autoConfig: {
        protectedEndpoints: computeNodes.map(n => n.id),
        preventionPolicy: 'enabled',
        agentDeployed: false // Will be deployed
      }
    });
  }

  // High: Identity & Access Management
  if (!analysis.existingProducts.has('okta') && analysis.hasInternet) {
    suggestions.push({
      productKey: 'okta',
      productName: 'Okta Workforce Identity',
      vendor: 'Okta',
      category: 'Identity',
      priority: 'high',
      reason: 'Internet-facing resources without MFA/SSO. Okta provides identity protection and adaptive authentication.',
      affectedResources: nodes.filter(n => n.data.type === 'internet' || n.data.type === 'compute').map(n => n.id),
      placement: {
        type: 'external',
        position: { x: 1200, y: 650 }
      },
      autoConfig: {
        mfaPolicy: 'required',
        privilegedAccountPolicy: 'phishing_resistant',
        adaptiveAuth: true
      }
    });
  }

  // High: Observability
  if (!analysis.existingProducts.has('datadog') && (analysis.hasCompute || analysis.hasKubernetes)) {
    const monitoredNodes = nodes.filter(n => n.data.type === 'compute' || n.data.type === 'kubernetes');
    const targetVpc = findParentVpc(monitoredNodes[0], nodes);
    suggestions.push({
      productKey: 'datadog',
      productName: 'Datadog Infrastructure Monitoring',
      vendor: 'Datadog',
      category: 'Observability',
      priority: 'high',
      reason: 'Infrastructure lacks observability. Datadog provides comprehensive monitoring, APM, and security insights.',
      affectedResources: monitoredNodes.map(n => n.id),
      placement: {
        type: 'inside_vpc',
        parentId: targetVpc?.id,
        position: { x: 1200, y: 900 }
      },
      autoConfig: {
        agentDeployed: false,
        connectedAccounts: analysis.cloudProviders
      }
    });
  }

  // High: Kubernetes Security (specific to K8s)
  if (analysis.hasKubernetes) {
    const k8sNodes = nodes.filter(n => n.data.type === 'kubernetes');
    
    // Suggest Defender for Containers or Prisma for K8s protection
    if (!analysis.existingProducts.has('defender') && !analysis.existingProducts.has('prisma_cloud')) {
      const targetVpc = findParentVpc(k8sNodes[0], nodes);
      suggestions.push({
        productKey: 'defender',
        productName: 'Defender for Containers',
        vendor: 'Microsoft',
        category: 'Security',
        priority: 'high',
        reason: 'Kubernetes clusters need runtime protection. Defender for Containers provides workload security.',
        affectedResources: k8sNodes.map(n => n.id),
        placement: {
          type: 'inside_vpc',
          parentId: targetVpc?.id,
          position: { x: 1200, y: 300 }
        },
        autoConfig: {
          defenderForContainers: true,
          protectedResources: k8sNodes.map(n => n.id)
        }
      });
    }
  }

  // Medium: Secrets Management
  if (!analysis.existingProducts.has('vault') && (analysis.hasDatabase || analysis.hasCompute)) {
    const consumerNodes = nodes.filter(n => n.data.type === 'database' || n.data.type === 'compute');
    const targetVpc = findParentVpc(consumerNodes[0], nodes);
    suggestions.push({
      productKey: 'vault',
      productName: 'HashiCorp Vault',
      vendor: 'HashiCorp',
      category: 'Secrets',
      priority: 'medium',
      reason: 'Databases and applications need secure secrets management. Vault runs inside the VPC to provide dynamic credentials.',
      affectedResources: consumerNodes.map(n => n.id),
      placement: {
        type: 'inside_vpc',
        parentId: targetVpc?.id,
        position: { x: 1200, y: 1150 }
      },
      autoConfig: {
        highAvailability: true,
        replicas: 3,
        autoUnseal: true,
        tlsEnabled: true
      }
    });
  }

  // Medium: SASE/Zero Trust (if multi-cloud or internet-facing)
  if (!analysis.existingProducts.has('cloudflare_one') && 
      !analysis.existingProducts.has('zscaler') &&
      (analysis.hasMultiCloud || analysis.hasInternet)) {
    const vpcNodes = nodes.filter(n => n.data.type === 'vpc' || n.data.type === 'vnet');
    const targetVpc = vpcNodes[0];
    suggestions.push({
      productKey: 'cloudflare_one',
      productName: 'Cloudflare One',
      vendor: 'Cloudflare',
      category: 'SASE',
      priority: 'medium',
      reason: 'Multi-cloud or internet-facing architecture needs Zero Trust access. Cloudflare One tunnel connector deploys inside VPC to protect services.',
      affectedResources: nodes.filter(n => n.data.type === 'internet' || n.data.type === 'vpc' || n.data.type === 'vnet').map(n => n.id),
      placement: {
        type: 'inside_vpc',
        parentId: targetVpc?.id,
        position: { x: 600, y: -150 }
      },
      autoConfig: {
        zeroTrustPolicies: ['authenticated-access'],
        gatewayDNS: true,
        httpInspection: true
      }
    });
  }

  // Medium: Backup & Recovery
  if (!analysis.existingProducts.has('rubrik') && (analysis.hasDatabase || analysis.hasStorage)) {
    suggestions.push({
      productKey: 'rubrik',
      productName: 'Rubrik Security Cloud',
      vendor: 'Rubrik',
      category: 'Resilience',
      priority: 'medium',
      reason: 'Critical data needs ransomware protection. Rubrik provides immutable backups and recovery.',
      affectedResources: nodes.filter(n => n.data.type === 'database' || n.data.type === 'storage').map(n => n.id),
      placement: {
        type: 'external',
        position: { x: 1200, y: 1400 }
      },
      autoConfig: {
        immutableBackups: true,
        backupEncryption: true,
        anomalyDetection: true
      }
    });
  }

  // Add Aviatrix suggestions if multi-cloud without Aviatrix
  if (analysis.hasMultiCloud && !hasAviatrixTransit(nodes)) {
    suggestions.push({
      productKey: 'aviatrix_transit',
      productName: 'Aviatrix Transit Gateway',
      vendor: 'Aviatrix',
      category: 'Networking',
      priority: 'high',
      reason: 'Multi-cloud deployment needs secure connectivity. Aviatrix provides encrypted transit backbone.',
      affectedResources: nodes.filter(n => n.data.type === 'vpc' || n.data.type === 'vnet').map(n => n.id),
      placement: {
        type: 'inline',
        position: { x: 600, y: 100 }
      },
      autoConfig: {
        transitMode: 'encrypted',
        firenetEnabled: true
      }
    });
  }

  return suggestions.sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

/**
 * Analyze the current architecture
 */
function analyzeArchitecture(nodes: any[], edges: any[]): ArchitectureAnalysis {
  const analysis: ArchitectureAnalysis = {
    hasCompute: false,
    hasKubernetes: false,
    hasDatabase: false,
    hasStorage: false,
    hasMultiCloud: false,
    hasInternet: false,
    cloudProviders: [],
    missingCapabilities: [],
    existingProducts: new Set(),
    vulnerabilities: []
  };

  const providerSet = new Set<string>();

  for (const node of nodes) {
    // Track resource types
    if (node.data.type === 'compute') analysis.hasCompute = true;
    if (node.data.type === 'kubernetes') analysis.hasKubernetes = true;
    if (node.data.type === 'database') analysis.hasDatabase = true;
    if (node.data.type === 'storage') analysis.hasStorage = true;
    if (node.data.type === 'internet') analysis.hasInternet = true;

    // Track cloud providers
    if (node.data.provider && ['aws', 'azure', 'gcp'].includes(node.data.provider)) {
      providerSet.add(node.data.provider);
    }

    // Track existing security products
    if (node.type === 'vendor' && node.data.vendor) {
      // Extract product key from vendor data
      const vendorName = node.data.vendor.toLowerCase().replace(/\s+/g, '_');
      analysis.existingProducts.add(vendorName);
    }
  }

  analysis.cloudProviders = Array.from(providerSet);
  analysis.hasMultiCloud = analysis.cloudProviders.length > 1;

  // Identify missing capabilities
  if (!analysis.existingProducts.has('prisma_cloud') && 
      !analysis.existingProducts.has('wiz') && 
      !analysis.existingProducts.has('defender')) {
    analysis.missingCapabilities.push('CSPM');
  }
  if (!analysis.existingProducts.has('crowdstrike') && analysis.hasCompute) {
    analysis.missingCapabilities.push('Endpoint Protection');
  }
  if (!analysis.existingProducts.has('okta')) {
    analysis.missingCapabilities.push('Identity & MFA');
  }
  if (!analysis.existingProducts.has('datadog')) {
    analysis.missingCapabilities.push('Observability');
  }
  if (!analysis.existingProducts.has('vault')) {
    analysis.missingCapabilities.push('Secrets Management');
  }

  // Check for vulnerabilities
  if (analysis.hasInternet && !analysis.existingProducts.has('cloudflare_one') && !analysis.existingProducts.has('zscaler')) {
    analysis.vulnerabilities.push('Internet-facing without Zero Trust');
  }
  if (analysis.hasKubernetes && !analysis.existingProducts.has('defender') && !analysis.existingProducts.has('prisma_cloud')) {
    analysis.vulnerabilities.push('Kubernetes without runtime protection');
  }

  return analysis;
}

/**
 * Check if Aviatrix transit exists
 */
function hasAviatrixTransit(nodes: any[]): boolean {
  return nodes.some(n => n.data.provider === 'aviatrix' && n.data.type === 'transit');
}

/**
 * Walk up the parentId chain to find the nearest VPC/VNet container for a node.
 * Returns the VPC/VNet node, or undefined if the node isn't inside one.
 */
function findParentVpc(node: any, allNodes: any[]): any | undefined {
  if (!node) return undefined;

  // If the node itself is a VPC/VNet, return it
  if (node.data.type === 'vpc' || node.data.type === 'vnet') return node;

  // Walk up parentId chain
  let current = node;
  while (current?.parentId) {
    const parent = allNodes.find(n => n.id === current.parentId);
    if (!parent) break;
    if (parent.data.type === 'vpc' || parent.data.type === 'vnet') return parent;
    current = parent;
  }

  // Fallback: find the first VPC/VNet in the graph
  return allNodes.find(n => n.data.type === 'vpc' || n.data.type === 'vnet');
}

/**
 * Generate placement position for a new product node.
 * For 'inside_vpc' products the returned position is **relative** to the parent container.
 * For 'external' products the position is absolute on the canvas.
 */
export function calculatePlacementPosition(
  productKey: string,
  existingNodes: any[],
  affectedResources: string[],
  parentId?: string
): { x: number; y: number } {
  const vendor = SECURITY_VENDORS[productKey as keyof typeof SECURITY_VENDORS];

  if (!vendor) return { x: 1200, y: 150 };

  const hierarchy = (vendor as any).hierarchy;
  const isInsideVpc = hierarchy?.placement === 'inside_vpc';

  if (isInsideVpc && parentId) {
    // Position is *relative* to the parent container.
    // Stack vendor nodes on the right side of the VPC.
    const siblingsInParent = existingNodes.filter(
      n => n.parentId === parentId && n.type === 'vendor'
    );
    const yOffset = siblingsInParent.length * 140;
    return { x: 400, y: 80 + yOffset };
  }

  // External products: stack on the right side of the canvas
  const existingExternal = existingNodes.filter(
    n => n.type === 'vendor' && !n.parentId
  );
  const yOffset = existingExternal.length * 200;
  return { x: 1200, y: 150 + yOffset };
}

/**
 * Apply a suggestion – create the vendor node with correct hierarchy.
 * Products marked `inside_vpc` get a `parentId` so they nest inside a VPC/VNet.
 * Products marked `external` remain standalone blocks.
 */
export function applySuggestion(suggestion: ProductSuggestion, existingNodes: any[]): any {
  const vendor = SECURITY_VENDORS[suggestion.productKey as keyof typeof SECURITY_VENDORS];
  
  if (!vendor) return null;

  const hierarchy = (vendor as any).hierarchy;
  const isInsideVpc = hierarchy?.placement === 'inside_vpc';
  const parentId = isInsideVpc ? suggestion.placement.parentId : undefined;

  const position = suggestion.placement.position || calculatePlacementPosition(
    suggestion.productKey,
    existingNodes,
    suggestion.affectedResources,
    parentId
  );

  const newNode: any = {
    id: `${suggestion.productKey}-${Date.now()}`,
    type: 'vendor',
    position,
    data: {
      type: 'vendor-integration',
      vendor: vendor.company,
      label: vendor.name,
      category: suggestion.category,
      color: vendor.color,
      integrationMode: vendor.integrationMode,
      requirements: vendor.requirements,
      configuration: suggestion.autoConfig || {},
      hierarchy: hierarchy?.placement || 'external',
      isMarketplace: true,
      showRequirements: true
    }
  };

  if (parentId) {
    newNode.parentId = parentId;
  }

  return newNode;
}

export default {
  generateProductSuggestions,
  calculatePlacementPosition,
  applySuggestion
};
