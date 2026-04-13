/**
 * Security & Infrastructure Product Catalog
 * Pre-populated marketplace entries for enterprise integrations
 */

export const SECURITY_PRODUCT_CATALOG = [
  {
    id: 'prisma-cloud',
    slug: 'prisma-cloud',
    name: 'Prisma Cloud',
    category: 'Security',
    shortDescription: 'Code-to-cloud security, posture, runtime, WAAS/API security',
    fullDescription: `Prisma Cloud by Palo Alto Networks provides comprehensive cloud security across the entire development lifecycle. 
    
Key features:
• API connector for findings ingest
• Attack-path and risk overlay visualization
• CSPM, CWPP, and WAAS capabilities
• Multi-cloud support (AWS, Azure, GCP)
• Real-time security posture monitoring`,
    logoRef: '/logos/prisma-cloud.svg',
    vendor: {
      displayName: 'Palo Alto Networks',
      verificationStatus: 'VERIFIED',
      slug: 'palo-alto-networks'
    },
    supportedProviders: ['aws', 'azure', 'gcp'],
    pricingMetadata: {
      pricingModel: 'Usage-based',
      trialAvailable: true,
      contactRequired: true
    },
    integrationSteps: [
      'Create Prisma Cloud account',
      'Generate API credentials',
      'Add cloud accounts to Prisma Cloud',
      'Deploy vendor node to your diagram',
      'Configure API connection block',
      'Link to protected resources'
    ],
    integrationMode: 'api_connector',
    requirements: {
      api_credentials: true,
      cloud_account_access: ['aws', 'azure', 'gcp'],
      network_connectivity: true,
      permissions: ['read', 'scan']
    },
    tags: ['CNAPP', 'CSPM', 'Security Posture', 'Runtime Protection'],
    documentationUrl: 'https://docs.paloaltonetworks.com/prisma/prisma-cloud',
    setupGuideUrl: '/docs/integrations/prisma-cloud'
  },
  {
    id: 'wiz',
    slug: 'wiz',
    name: 'Wiz',
    category: 'Security',
    shortDescription: 'Cloud visibility, attack-path analysis, CSPM/CNAPP',
    fullDescription: `Wiz provides agentless cloud security with deep visibility and attack path analysis.

Key features:
• Agentless scanning and discovery
• Security graph visualization
• Attack path analysis
• Vulnerability and misconfiguration detection
• Connect-and-scan experience`,
    logoRef: '/logos/wiz.svg',
    vendor: {
      displayName: 'Wiz',
      verificationStatus: 'VERIFIED',
      slug: 'wiz'
    },
    supportedProviders: ['aws', 'azure', 'gcp'],
    pricingMetadata: {
      pricingModel: 'Asset-based',
      trialAvailable: true,
      contactRequired: true
    },
    integrationSteps: [
      'Sign up for Wiz account',
      'Connect cloud accounts via connector',
      'Initiate security scan',
      'Add Wiz vendor node to diagram',
      'View security graph overlay',
      'Review attack path findings'
    ],
    integrationMode: 'api_connector',
    requirements: {
      api_credentials: true,
      cloud_account_access: ['aws', 'azure', 'gcp'],
      network_connectivity: true,
      scan_permissions: true
    },
    tags: ['CNAPP', 'Attack Paths', 'Cloud Security Graph', 'Agentless'],
    documentationUrl: 'https://docs.wiz.io',
    setupGuideUrl: '/docs/integrations/wiz'
  },
  {
    id: 'defender-cloud',
    slug: 'defender-cloud',
    name: 'Microsoft Defender for Cloud',
    category: 'Security',
    shortDescription: 'Multicloud CNAPP, CSPM, workload protection, recommendations',
    fullDescription: `Microsoft Defender for Cloud delivers unified security management and threat protection.

Key features:
• Native Azure integration
• Multi-cloud CSPM (AWS, GCP)
• Workload protection for VMs, containers, databases
• Security recommendations and compliance
• Just-in-time VM access`,
    logoRef: '/logos/defender.svg',
    vendor: {
      displayName: 'Microsoft',
      verificationStatus: 'VERIFIED',
      slug: 'microsoft'
    },
    supportedProviders: ['azure', 'aws', 'gcp'],
    pricingMetadata: {
      pricingModel: 'Per-resource',
      trialAvailable: true,
      contactRequired: false
    },
    integrationSteps: [
      'Enable Defender for Cloud in Azure portal',
      'Connect AWS/GCP accounts',
      'Deploy agents to workloads',
      'Add Defender node to diagram',
      'Ingest recommendations and findings',
      'Map security policies'
    ],
    integrationMode: 'native_azure',
    requirements: {
      azure_subscription: true,
      cloud_account_access: ['azure', 'aws', 'gcp'],
      agent_deployment: true
    },
    tags: ['CNAPP', 'CSPM', 'Azure', 'Workload Protection'],
    documentationUrl: 'https://docs.microsoft.com/azure/defender-for-cloud',
    setupGuideUrl: '/docs/integrations/defender-cloud'
  },
  {
    id: 'crowdstrike-falcon',
    slug: 'crowdstrike-falcon',
    name: 'CrowdStrike Falcon Endpoint Security',
    category: 'Security',
    shortDescription: 'Endpoint protection, EDR, response on servers/endpoints',
    fullDescription: `CrowdStrike Falcon delivers cloud-native endpoint protection platform.

Key features:
• Lightweight agent deployment
• Real-time threat detection and response
• EDR and threat hunting
• Cloud workload protection
• Protected-node overlay visualization`,
    logoRef: '/logos/crowdstrike.svg',
    vendor: {
      displayName: 'CrowdStrike',
      verificationStatus: 'VERIFIED',
      slug: 'crowdstrike'
    },
    supportedProviders: ['aws', 'azure', 'gcp'],
    pricingMetadata: {
      pricingModel: 'Per-endpoint',
      trialAvailable: true,
      contactRequired: true
    },
    integrationSteps: [
      'Create CrowdStrike account',
      'Generate API credentials',
      'Deploy Falcon agent to compute instances',
      'Add CrowdStrike vendor node',
      'Configure agent deployment pattern',
      'Map protected endpoints'
    ],
    integrationMode: 'agent_deployment',
    requirements: {
      api_credentials: true,
      compute_access: true,
      agent_deployment: true,
      network_connectivity: true
    },
    tags: ['Endpoint Security', 'EDR', 'Threat Detection', 'Agent-based'],
    documentationUrl: 'https://falcon.crowdstrike.com/documentation',
    setupGuideUrl: '/docs/integrations/crowdstrike'
  },
  {
    id: 'okta-workforce',
    slug: 'okta-workforce',
    name: 'Okta Workforce Identity',
    category: 'Identity',
    shortDescription: 'SSO, adaptive MFA, workforce identity and access',
    fullDescription: `Okta Workforce Identity provides comprehensive identity and access management.

Key features:
• Single Sign-On (SSO)
• Adaptive Multi-Factor Authentication
• User lifecycle management
• Identity node visualization
• App-access flow simulation`,
    logoRef: '/logos/okta.svg',
    vendor: {
      displayName: 'Okta',
      verificationStatus: 'VERIFIED',
      slug: 'okta'
    },
    supportedProviders: [],
    pricingMetadata: {
      pricingModel: 'Per-user',
      trialAvailable: true,
      contactRequired: false
    },
    integrationSteps: [
      'Create Okta developer account',
      'Configure SSO applications',
      'Set up MFA policies',
      'Add Okta identity node to diagram',
      'Model SSO/MFA policy flows',
      'Simulate app-access flows'
    ],
    integrationMode: 'identity_plugin',
    requirements: {
      api_credentials: true,
      domain_verification: true,
      network_connectivity: true
    },
    tags: ['Identity', 'SSO', 'MFA', 'IAM'],
    documentationUrl: 'https://developer.okta.com',
    setupGuideUrl: '/docs/integrations/okta'
  },
  {
    id: 'cloudflare-one',
    slug: 'cloudflare-one',
    name: 'Cloudflare One',
    category: 'Networking',
    shortDescription: 'Zero trust access, SASE/SSE, network/user/app protection',
    fullDescription: `Cloudflare One provides a complete SASE/SSE platform.

Key features:
• Zero Trust Network Access (ZTNA)
• Secure Web Gateway (SWG)
• Cloud Access Security Broker (CASB)
• Edge security node visualization
• Access path modeling`,
    logoRef: '/logos/cloudflare.svg',
    vendor: {
      displayName: 'Cloudflare',
      verificationStatus: 'VERIFIED',
      slug: 'cloudflare'
    },
    supportedProviders: [],
    pricingMetadata: {
      pricingModel: 'Per-user',
      trialAvailable: true,
      contactRequired: false
    },
    integrationSteps: [
      'Sign up for Cloudflare account',
      'Configure Zero Trust dashboard',
      'Set up access policies',
      'Add Cloudflare edge node',
      'Model access paths',
      'Enable product trial'
    ],
    integrationMode: 'edge_security',
    requirements: {
      api_credentials: true,
      dns_configuration: true,
      network_connectivity: true
    },
    tags: ['SASE', 'Zero Trust', 'Edge Security', 'ZTNA'],
    documentationUrl: 'https://developers.cloudflare.com/cloudflare-one',
    setupGuideUrl: '/docs/integrations/cloudflare-one'
  },
  {
    id: 'zscaler-zte',
    slug: 'zscaler-zte',
    name: 'Zscaler Zero Trust Exchange',
    category: 'Networking',
    shortDescription: 'Zero trust access and network transformation for users/workloads',
    fullDescription: `Zscaler Zero Trust Exchange delivers security at the edge.

Key features:
• Zero trust network architecture
• Cloud-delivered security services
• App connector deployment
• Zero-trust edge node visualization
• Path-hardening simulation`,
    logoRef: '/logos/zscaler.svg',
    vendor: {
      displayName: 'Zscaler',
      verificationStatus: 'VERIFIED',
      slug: 'zscaler'
    },
    supportedProviders: [],
    pricingMetadata: {
      pricingModel: 'Per-user',
      trialAvailable: true,
      contactRequired: true
    },
    integrationSteps: [
      'Request Zscaler demo/trial',
      'Deploy app connectors',
      'Configure access policies',
      'Add Zscaler zero-trust edge node',
      'Simulate path hardening',
      'Contact for evaluation'
    ],
    integrationMode: 'zero_trust_edge',
    requirements: {
      api_credentials: true,
      connector_deployment: true,
      agent_deployment: true,
      network_connectivity: true
    },
    tags: ['SASE', 'Zero Trust', 'Edge Security', 'Network Transformation'],
    documentationUrl: 'https://help.zscaler.com',
    setupGuideUrl: '/docs/integrations/zscaler'
  },
  {
    id: 'datadog-monitoring',
    slug: 'datadog-monitoring',
    name: 'Datadog Infrastructure Monitoring',
    category: 'Observability',
    shortDescription: 'Infra/network/app telemetry, alerting, visibility',
    fullDescription: `Datadog provides comprehensive observability across your infrastructure.

Key features:
• Infrastructure and network monitoring
• Application Performance Monitoring (APM)
• Log aggregation and analysis
• Agent/chart/module injection
• Telemetry coverage overlay`,
    logoRef: '/logos/datadog.svg',
    vendor: {
      displayName: 'Datadog',
      verificationStatus: 'VERIFIED',
      slug: 'datadog'
    },
    supportedProviders: ['aws', 'azure', 'gcp'],
    pricingMetadata: {
      pricingModel: 'Per-host',
      trialAvailable: true,
      contactRequired: false
    },
    integrationSteps: [
      'Create Datadog account',
      'Generate API key',
      'Deploy Datadog agent to resources',
      'Add Datadog monitoring node',
      'Inject agent/chart modules',
      'View telemetry coverage overlay'
    ],
    integrationMode: 'agent_telemetry',
    requirements: {
      api_credentials: true,
      cloud_account_access: ['aws', 'azure', 'gcp'],
      agent_deployment: true,
      metrics_endpoint: true,
      network_connectivity: true
    },
    tags: ['Observability', 'Monitoring', 'APM', 'Logs'],
    documentationUrl: 'https://docs.datadoghq.com',
    setupGuideUrl: '/docs/integrations/datadog'
  },
  {
    id: 'rubrik-security-cloud',
    slug: 'rubrik-security-cloud',
    name: 'Rubrik Security Cloud',
    category: 'Storage',
    shortDescription: 'Backup, immutable recovery, cyber resilience',
    fullDescription: `Rubrik Security Cloud delivers data protection and cyber resilience.

Key features:
• Cloud-native backup and recovery
• Immutable snapshots
• Ransomware protection
• Backup/recovery node visualization
• Protection-policy simulation`,
    logoRef: '/logos/rubrik.svg',
    vendor: {
      displayName: 'Rubrik',
      verificationStatus: 'VERIFIED',
      slug: 'rubrik'
    },
    supportedProviders: ['aws', 'azure', 'gcp'],
    pricingMetadata: {
      pricingModel: 'Capacity-based',
      trialAvailable: true,
      contactRequired: true
    },
    integrationSteps: [
      'Sign up for Rubrik Security Cloud',
      'Connect cloud accounts',
      'Configure backup policies',
      'Add Rubrik backup/recovery node',
      'Simulate protection policies',
      'View recovery metadata'
    ],
    integrationMode: 'backup_recovery',
    requirements: {
      api_credentials: true,
      cloud_account_access: ['aws', 'azure', 'gcp'],
      storage_access: true,
      snapshot_permissions: true,
      network_connectivity: true
    },
    tags: ['Backup', 'Disaster Recovery', 'Cyber Resilience', 'Ransomware Protection'],
    documentationUrl: 'https://docs.rubrik.com',
    setupGuideUrl: '/docs/integrations/rubrik'
  },
  {
    id: 'vault',
    slug: 'vault',
    name: 'HashiCorp Vault',
    category: 'Security',
    shortDescription: 'Secrets management, dynamic creds, encryption, audit',
    fullDescription: `HashiCorp Vault provides secrets management and data protection.

Key features:
• Centralized secrets management
• Dynamic credentials generation
• Encryption as a service
• Native secret-plane integration
• Dynamic-credential workflow`,
    logoRef: '/logos/vault.svg',
    vendor: {
      displayName: 'HashiCorp',
      verificationStatus: 'VERIFIED',
      slug: 'hashicorp'
    },
    supportedProviders: [],
    pricingMetadata: {
      pricingModel: 'Open Source / Enterprise',
      trialAvailable: true,
      contactRequired: false
    },
    integrationSteps: [
      'Deploy Vault server or use HCP Vault',
      'Initialize and unseal Vault',
      'Configure secret engines',
      'Add Vault secret-plane node',
      'Integrate with infrastructure resources',
      'Enable dynamic-credential workflow'
    ],
    integrationMode: 'secret_plane',
    requirements: {
      vault_address: true,
      vault_token: true,
      network_connectivity: true
    },
    tags: ['Secrets Management', 'Dynamic Credentials', 'Encryption', 'Zero Trust'],
    documentationUrl: 'https://www.vaultproject.io/docs',
    setupGuideUrl: '/docs/integrations/vault'
  }
];

export default SECURITY_PRODUCT_CATALOG;
