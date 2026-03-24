/**
 * Security & Infrastructure Vendor Integration Blocks
 * Extends Terraform blocks with third-party security, observability, and infrastructure products
 */

import * as Blockly from 'blockly';

export const SECURITY_VENDORS = {
  'prisma_cloud': {
    name: 'Prisma Cloud',
    company: 'Palo Alto Networks',
    prefix: 'prismacloud_',
    color: '#FA582D',
    category: 'CNAPP',
    description: 'Code-to-cloud security, posture, runtime, WAAS/API security',
    registry: 'paloaltonetworks/prismacloud',
    icon: '🛡️',
    integrationMode: 'api_connector',
    hierarchy: {
      placement: 'external',
      nestable: false,
      description: 'SaaS CNAPP — scans via cloud APIs, never deployed inside a VPC'
    },
    requirements: {
      api_key: true,
      cloud_accounts: ['aws', 'azure', 'gcp'],
      agent_deployment: false,
      network_access: true
    }
  },
  'wiz': {
    name: 'Wiz',
    company: 'Wiz',
    prefix: 'wiz_',
    color: '#6B4FBB',
    category: 'CNAPP',
    description: 'Cloud visibility, attack-path analysis, CSPM/CNAPP',
    registry: 'wiz-sec/wiz',
    icon: '🔍',
    integrationMode: 'api_connector',
    hierarchy: {
      placement: 'external',
      nestable: false,
      description: 'SaaS CNAPP — agentless scanning via snapshots, never inside a VPC'
    },
    requirements: {
      api_key: true,
      cloud_accounts: ['aws', 'azure', 'gcp'],
      agent_deployment: false,
      network_access: true,
      scan_permissions: true
    }
  },
  'defender': {
    name: 'Defender for Cloud',
    company: 'Microsoft',
    prefix: 'azurerm_security_',
    color: '#00A4EF',
    category: 'CNAPP',
    description: 'Multicloud CNAPP, CSPM, workload protection',
    registry: 'hashicorp/azurerm',
    icon: '🛡️',
    integrationMode: 'native_azure',
    hierarchy: {
      placement: 'inside_vpc',
      nestable: true,
      nestsInside: ['vnet', 'subnet'],
      description: 'Azure-native agent deployed on VMs/K8s inside VNet'
    },
    requirements: {
      azure_subscription: true,
      cloud_accounts: ['azure', 'aws', 'gcp'],
      agent_deployment: true,
      network_access: false
    }
  },
  'crowdstrike': {
    name: 'Falcon Endpoint Security',
    company: 'CrowdStrike',
    prefix: 'crowdstrike_',
    color: '#E01F3D',
    category: 'Endpoint',
    description: 'Endpoint protection, EDR, response on servers/endpoints',
    registry: 'crowdstrike/falcon',
    icon: '🦅',
    integrationMode: 'agent_deployment',
    hierarchy: {
      placement: 'inside_vpc',
      nestable: true,
      nestsInside: ['vpc', 'vnet', 'subnet'],
      description: 'Falcon agent installed on each compute instance inside VPC/subnet'
    },
    requirements: {
      api_key: true,
      cloud_accounts: ['aws', 'azure', 'gcp'],
      agent_deployment: true,
      network_access: true,
      compute_access: true
    }
  },
  'okta': {
    name: 'Workforce Identity',
    company: 'Okta',
    prefix: 'okta_',
    color: '#007DC1',
    category: 'Identity',
    description: 'SSO, adaptive MFA, workforce identity and access',
    registry: 'okta/okta',
    icon: '🔐',
    integrationMode: 'identity_plugin',
    hierarchy: {
      placement: 'external',
      nestable: false,
      description: 'SaaS identity provider — standalone block, connects to services via SAML/OIDC'
    },
    requirements: {
      api_key: true,
      cloud_accounts: [],
      agent_deployment: false,
      network_access: true,
      domain_verification: true
    }
  },
  'cloudflare_one': {
    name: 'Cloudflare One',
    company: 'Cloudflare',
    prefix: 'cloudflare_',
    color: '#F38020',
    category: 'SASE',
    description: 'Zero trust access, SASE/SSE, network/user/app protection',
    registry: 'cloudflare/cloudflare',
    icon: '🌐',
    integrationMode: 'edge_security',
    hierarchy: {
      placement: 'inside_vpc',
      nestable: true,
      nestsInside: ['vpc', 'vnet', 'subnet'],
      connectsTo: ['compute', 'kubernetes'],
      description: 'Tunnel connector deployed inside VPC, connected to VMs/services it protects'
    },
    requirements: {
      api_key: true,
      cloud_accounts: [],
      agent_deployment: false,
      network_access: true,
      dns_configuration: true
    }
  },
  'zscaler': {
    name: 'Zero Trust Exchange',
    company: 'Zscaler',
    prefix: 'zscaler_',
    color: '#0D9DDB',
    category: 'SASE',
    description: 'Zero trust access and network transformation',
    registry: 'zscaler/zscaler',
    icon: '🔒',
    integrationMode: 'zero_trust_edge',
    hierarchy: {
      placement: 'inside_vpc',
      nestable: true,
      nestsInside: ['vpc', 'vnet', 'subnet'],
      description: 'App Connector deployed inside VPC to broker zero trust access'
    },
    requirements: {
      api_key: true,
      cloud_accounts: [],
      agent_deployment: true,
      network_access: true,
      connector_deployment: true
    }
  },
  'datadog': {
    name: 'Infrastructure Monitoring',
    company: 'Datadog',
    prefix: 'datadog_',
    color: '#632CA6',
    category: 'Observability',
    description: 'Infra/network/app telemetry, alerting, visibility',
    registry: 'datadog/datadog',
    icon: '📊',
    integrationMode: 'agent_telemetry',
    hierarchy: {
      placement: 'inside_vpc',
      nestable: true,
      nestsInside: ['vpc', 'vnet', 'subnet'],
      description: 'Agent (DaemonSet/sidecar) runs on nodes inside the VPC'
    },
    requirements: {
      api_key: true,
      cloud_accounts: ['aws', 'azure', 'gcp'],
      agent_deployment: true,
      network_access: true,
      metrics_endpoint: true
    }
  },
  'rubrik': {
    name: 'Rubrik Security Cloud',
    company: 'Rubrik',
    prefix: 'rubrik_',
    color: '#00B388',
    category: 'Resilience',
    description: 'Backup, immutable recovery, cyber resilience',
    registry: 'rubrik/rubrik',
    icon: '💾',
    integrationMode: 'backup_recovery',
    hierarchy: {
      placement: 'external',
      nestable: false,
      description: 'SaaS backup service — external block, connects to data stores via API'
    },
    requirements: {
      api_key: true,
      cloud_accounts: ['aws', 'azure', 'gcp'],
      agent_deployment: false,
      network_access: true,
      storage_access: true,
      snapshot_permissions: true
    }
  },
  'vault': {
    name: 'Vault',
    company: 'HashiCorp',
    prefix: 'vault_',
    color: '#FFD814',
    category: 'Secrets',
    description: 'Secrets management, dynamic creds, encryption, audit',
    registry: 'hashicorp/vault',
    icon: '🔑',
    integrationMode: 'secret_plane',
    hierarchy: {
      placement: 'inside_vpc',
      nestable: true,
      nestsInside: ['vpc', 'vnet', 'subnet'],
      description: 'Self-hosted Vault server runs inside VPC/subnet (or HCP Vault as external)'
    },
    requirements: {
      vault_address: true,
      cloud_accounts: [],
      agent_deployment: false,
      network_access: true,
      vault_token: true
    }
  }
};

// Block definitions for security integrations
export const defineSecurityIntegrationBlocks = () => {
  const blocks = [];

  // Create a block for each security vendor
  for (const [vendorKey, vendor] of Object.entries(SECURITY_VENDORS)) {
    blocks.push({
      "type": `security_integration_${vendorKey}`,
      "message0": `${vendor.icon} ${vendor.name} Integration %1 %2 %3`,
      "args0": [
        { "type": "input_dummy" },
        { "type": "field_label", "text": `by ${vendor.company}` },
        { "type": "input_statement", "name": "CONFIG" }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": vendor.color,
      "tooltip": vendor.description,
      "helpUrl": ""
    });

    // Connection configuration block
    blocks.push({
      "type": `${vendorKey}_connection`,
      "message0": `API Connection %1 Endpoint: %2 %3 API Key: %4`,
      "args0": [
        { "type": "input_dummy" },
        { "type": "field_input", "name": "ENDPOINT", "text": "https://api.example.com" },
        { "type": "input_dummy" },
        { "type": "field_input", "name": "API_KEY", "text": "var.api_key" }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": vendor.color,
      "tooltip": `Configure ${vendor.name} API connection`
    });

    // Protected resource block
    blocks.push({
      "type": `${vendorKey}_protected_resource`,
      "message0": `Protected Resources %1 %2`,
      "args0": [
        { "type": "input_dummy" },
        { "type": "field_input", "name": "RESOURCES", "text": "aws_instance.*, azurerm_vm.*" }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": vendor.color,
      "tooltip": `Specify resources protected by ${vendor.name}`
    });
  }

  // Generic security policy block
  blocks.push({
    "type": "security_policy",
    "message0": "Security Policy %1 %2 Name: %3 %4 Enforcement: %5 %6 Rules: %7",
    "args0": [
      { "type": "input_dummy" },
      { "type": "input_dummy" },
      { "type": "field_input", "name": "NAME", "text": "default-policy" },
      { "type": "input_dummy" },
      { "type": "field_dropdown", "name": "MODE", "options": [
        ["Alert", "alert"],
        ["Block", "block"],
        ["Audit", "audit"]
      ]},
      { "type": "input_dummy" },
      { "type": "input_statement", "name": "RULES" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": 270,
    "tooltip": "Define security policy"
  });

  // Compliance requirement block
  blocks.push({
    "type": "compliance_requirement",
    "message0": "Compliance Standard %1 %2",
    "args0": [
      { "type": "field_dropdown", "name": "STANDARD", "options": [
        ["PCI-DSS", "pci-dss"],
        ["HIPAA", "hipaa"],
        ["SOC 2", "soc2"],
        ["ISO 27001", "iso27001"],
        ["GDPR", "gdpr"],
        ["NIST", "nist"]
      ]},
      { "type": "input_statement", "name": "CONTROLS" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": 230,
    "tooltip": "Specify compliance requirements"
  });

  // Attack path simulation block
  blocks.push({
    "type": "attack_path_analysis",
    "message0": "Attack Path Analysis %1 From: %2 %3 To: %4",
    "args0": [
      { "type": "input_dummy" },
      { "type": "field_input", "name": "SOURCE", "text": "internet" },
      { "type": "input_dummy" },
      { "type": "field_input", "name": "TARGET", "text": "data.aws_db.*" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": 0,
    "tooltip": "Simulate attack paths from source to target"
  });

  Blockly.common.defineBlocksWithJsonArray(blocks);
};

// Get requirements for a vendor
export function getVendorRequirements(vendorKey) {
  return SECURITY_VENDORS[vendorKey]?.requirements || {};
}

// Check if a vendor is compatible with a provider
export function isVendorCompatible(vendorKey, provider) {
  const vendor = SECURITY_VENDORS[vendorKey];
  if (!vendor) return false;
  
  const cloudAccounts = vendor.requirements.cloud_accounts || [];
  return cloudAccounts.length === 0 || cloudAccounts.includes(provider);
}

export default {
  SECURITY_VENDORS,
  defineSecurityIntegrationBlocks,
  getVendorRequirements,
  isVendorCompatible
};
