/**
 * Security Integration Rules & Connection Patterns
 * Defines how each security product connects to infrastructure and enforces policies
 */

export const SECURITY_INTEGRATION_RULES = {
  // CNAPP / Cloud Security Platforms
  'prisma_cloud': {
    productName: 'Prisma Cloud',
    category: 'CNAPP',
    connectionPattern: {
      type: 'api_observer',
      direction: 'bidirectional',
      connectsTo: ['compute', 'storage', 'network', 'kubernetes', 'vpc', 'vnet', 'subnet'],
      requiresDirectConnection: false,
      scanMethod: 'agentless_api'
    },
    architectureIntegration: {
      placement: 'external',
      nestable: false,
      visibility: 'all_cloud_resources',
      enforcement: 'policy_based',
      requirements: [
        'Read-only API access to cloud accounts',
        'CloudTrail/Activity Log/Cloud Audit access',
        'Network reachability to Prisma Cloud SaaS',
        'IAM permissions for resource inspection'
      ]
    },
    securityRules: [
      {
        id: 'PR-001',
        severity: 'critical',
        rule: 'API credentials must be stored in secrets manager',
        validation: (config) => config.apiKeySource === 'vault' || config.apiKeySource === 'secrets_manager',
        errorMessage: 'Prisma Cloud API credentials must not be hardcoded. Use Vault or cloud secrets manager.'
      },
      {
        id: 'PR-002',
        severity: 'high',
        rule: 'Must have read access to all cloud accounts in diagram',
        validation: (config, nodes) => {
          const cloudAccounts = new Set(nodes.filter(n => ['aws', 'azure', 'gcp'].includes(n.data.provider)).map(n => n.data.provider));
          return config.connectedAccounts && cloudAccounts.every(account => config.connectedAccounts.includes(account));
        },
        errorMessage: 'Prisma Cloud must be connected to all cloud providers used in this architecture.'
      },
      {
        id: 'PR-003',
        severity: 'medium',
        rule: 'Enable automatic remediation only in non-production',
        validation: (config) => !config.autoRemediation || config.environment !== 'production',
        warningMessage: 'Auto-remediation in production can cause service disruptions. Use alert-only mode.'
      },
      {
        id: 'PR-004',
        severity: 'low',
        rule: 'Compliance frameworks should be configured',
        validation: (config) => config.complianceFrameworks && config.complianceFrameworks.length > 0,
        warningMessage: 'Configure compliance frameworks (PCI-DSS, HIPAA, SOC2) for better governance.'
      }
    ],
    protectionCapabilities: {
      cspm: true,
      cwpp: true,
      cnspm: true,
      waas: true,
      attackPathAnalysis: true,
      runtimeProtection: true
    },
    dataFlows: [
      { from: 'cloud_apis', to: 'prisma_cloud', protocol: 'HTTPS', port: 443, data: 'configuration_metadata' },
      { from: 'prisma_cloud', to: 'protected_resources', protocol: 'HTTPS', port: 443, data: 'scan_results' },
      { from: 'audit_logs', to: 'prisma_cloud', protocol: 'HTTPS', port: 443, data: 'activity_logs' }
    ],
    requiredPermissions: {
      aws: ['ReadOnlyAccess', 'SecurityAudit'],
      azure: ['Reader', 'Security Reader'],
      gcp: ['Viewer', 'Security Reviewer']
    }
  },

  'wiz': {
    productName: 'Wiz',
    category: 'CNAPP',
    connectionPattern: {
      type: 'agentless_scanner',
      direction: 'pull',
      connectsTo: ['compute', 'storage', 'kubernetes', 'database', 'vpc', 'vnet'],
      requiresDirectConnection: false,
      scanMethod: 'snapshot_analysis'
    },
    architectureIntegration: {
      placement: 'external',
      nestable: false,
      visibility: 'all_cloud_resources',
      enforcement: 'advisory',
      requirements: [
        'Cloud account connector with snapshot permissions',
        'Network access to Wiz SaaS platform',
        'Read permissions for resource metadata',
        'Disk snapshot permissions for deep scanning'
      ]
    },
    securityRules: [
      {
        id: 'WIZ-001',
        severity: 'critical',
        rule: 'Wiz connector must use least privilege IAM role',
        validation: (config) => config.iamRole && config.iamRole.includes('ReadOnly'),
        errorMessage: 'Wiz connector should use read-only IAM role with snapshot permissions only.'
      },
      {
        id: 'WIZ-002',
        severity: 'high',
        rule: 'Snapshot encryption must be enabled',
        validation: (config) => config.snapshotEncryption === true,
        errorMessage: 'Enable snapshot encryption for Wiz disk scanning to protect data at rest.'
      },
      {
        id: 'WIZ-003',
        severity: 'high',
        rule: 'Attack path analysis must be enabled',
        validation: (config) => config.attackPathAnalysis !== false,
        warningMessage: 'Attack path analysis provides critical security insights. Enable for full visibility.'
      },
      {
        id: 'WIZ-004',
        severity: 'medium',
        rule: 'Network exposure detection should be configured',
        validation: (config) => config.networkExposureDetection === true,
        warningMessage: 'Enable network exposure detection to identify publicly accessible resources.'
      }
    ],
    protectionCapabilities: {
      cspm: true,
      vulnerabilityManagement: true,
      attackPathAnalysis: true,
      secretsDetection: true,
      malwareDetection: true,
      containerSecurity: true
    },
    dataFlows: [
      { from: 'wiz', to: 'cloud_accounts', protocol: 'HTTPS', port: 443, data: 'snapshot_requests' },
      { from: 'disk_snapshots', to: 'wiz', protocol: 'HTTPS', port: 443, data: 'filesystem_data' },
      { from: 'wiz', to: 'security_graph', protocol: 'Internal', data: 'relationship_data' }
    ],
    requiredPermissions: {
      aws: ['ReadOnlyAccess', 'ec2:CreateSnapshot', 'ec2:DeleteSnapshot'],
      azure: ['Reader', 'Disk Snapshot Contributor'],
      gcp: ['Viewer', 'Compute Storage Admin']
    }
  },

  'defender': {
    productName: 'Microsoft Defender for Cloud',
    category: 'CNAPP',
    connectionPattern: {
      type: 'native_integration',
      direction: 'bidirectional',
      connectsTo: ['compute', 'storage', 'kubernetes', 'database', 'vnet', 'subnet'],
      requiresDirectConnection: true,
      scanMethod: 'agent_based_and_agentless'
    },
    architectureIntegration: {
      placement: 'inside_vpc',
      nestable: true,
      nestsInside: ['vnet', 'subnet'],
      visibility: 'multi_cloud_resources',
      enforcement: 'policy_and_jit_access',
      requirements: [
        'Azure subscription (primary)',
        'Multi-cloud connectors for AWS/GCP',
        'Log Analytics workspace',
        'Defender agent deployment for servers'
      ]
    },
    securityRules: [
      {
        id: 'DEF-001',
        severity: 'critical',
        rule: 'Defender for Servers must be enabled on all VMs',
        validation: (config, nodes) => {
          const vms = nodes.filter(n => n.data.type === 'compute');
          return config.protectedResources && vms.every(vm => config.protectedResources.includes(vm.id));
        },
        errorMessage: 'All compute instances must have Defender for Servers enabled for workload protection.'
      },
      {
        id: 'DEF-002',
        severity: 'high',
        rule: 'Just-in-Time VM access should be enabled',
        validation: (config) => config.jitAccess === true,
        warningMessage: 'Enable JIT VM access to reduce attack surface by closing management ports.'
      },
      {
        id: 'DEF-003',
        severity: 'high',
        rule: 'Defender for Containers required for AKS/EKS/GKE',
        validation: (config, nodes) => {
          const k8s = nodes.filter(n => n.data.type === 'kubernetes');
          return k8s.length === 0 || config.defenderForContainers === true;
        },
        errorMessage: 'Kubernetes clusters detected. Enable Defender for Containers for runtime protection.'
      },
      {
        id: 'DEF-004',
        severity: 'medium',
        rule: 'Auto-provisioning of agents should be enabled',
        validation: (config) => config.autoProvisioning === true,
        warningMessage: 'Enable auto-provisioning to automatically deploy Defender agents to new resources.'
      }
    ],
    protectionCapabilities: {
      cspm: true,
      cwpp: true,
      containerSecurity: true,
      jitAccess: true,
      fileIntegrityMonitoring: true,
      adaptiveNetworkHardening: true
    },
    dataFlows: [
      { from: 'defender_agents', to: 'log_analytics', protocol: 'HTTPS', port: 443, data: 'security_events' },
      { from: 'azure_resources', to: 'defender', protocol: 'Azure Fabric', data: 'resource_metadata' },
      { from: 'defender', to: 'protected_vms', protocol: 'SSH/RDP', port: 'JIT', data: 'management_access' }
    ],
    requiredPermissions: {
      azure: ['Security Admin', 'Contributor'],
      aws: ['SecurityAudit', 'ReadOnlyAccess'],
      gcp: ['Security Reviewer']
    }
  },

  'crowdstrike': {
    productName: 'CrowdStrike Falcon',
    category: 'Endpoint',
    connectionPattern: {
      type: 'agent_based',
      direction: 'outbound',
      connectsTo: ['compute', 'kubernetes'],
      requiresDirectConnection: true,
      scanMethod: 'real_time_agent'
    },
    architectureIntegration: {
      placement: 'inside_vpc',
      nestable: true,
      nestsInside: ['vpc', 'vnet', 'subnet'],
      visibility: 'compute_instances_only',
      enforcement: 'real_time_blocking',
      requirements: [
        'Falcon agent installed on all compute instances',
        'Outbound HTTPS (443) access to CrowdStrike cloud',
        'Agent registration with CrowdStrike console',
        'Kernel-level permissions for EDR'
      ]
    },
    securityRules: [
      {
        id: 'CS-001',
        severity: 'critical',
        rule: 'All compute instances must have Falcon agent installed',
        validation: (config, nodes) => {
          const compute = nodes.filter(n => n.data.type === 'compute');
          return config.protectedEndpoints && compute.every(c => config.protectedEndpoints.includes(c.id));
        },
        errorMessage: 'CrowdStrike Falcon agent must be installed on all compute instances for endpoint protection.'
      },
      {
        id: 'CS-002',
        severity: 'critical',
        rule: 'Prevention policy must be enabled in production',
        validation: (config) => config.environment !== 'production' || config.preventionPolicy === 'enabled',
        errorMessage: 'Prevention policy must be enabled in production environments to block threats.'
      },
      {
        id: 'CS-003',
        severity: 'high',
        rule: 'Agent must have network access to CrowdStrike cloud',
        validation: (config, nodes) => {
          const egress = nodes.find(n => n.id === 'internet' || n.data.type === 'internet');
          return egress !== undefined || config.proxyConfigured === true;
        },
        errorMessage: 'Falcon agents require outbound HTTPS access to CrowdStrike cloud or configured proxy.'
      },
      {
        id: 'CS-004',
        severity: 'medium',
        rule: 'Container runtime security should be enabled for K8s',
        validation: (config, nodes) => {
          const k8s = nodes.filter(n => n.data.type === 'kubernetes');
          return k8s.length === 0 || config.containerSecurity === true;
        },
        warningMessage: 'Enable Falcon Container Security for Kubernetes clusters.'
      }
    ],
    protectionCapabilities: {
      edr: true,
      antivirus: true,
      threatIntelligence: true,
      behavioralAnalysis: true,
      containerRuntime: true,
      fileIntegrityMonitoring: true
    },
    dataFlows: [
      { from: 'falcon_agents', to: 'crowdstrike_cloud', protocol: 'HTTPS', port: 443, data: 'telemetry_events' },
      { from: 'crowdstrike_cloud', to: 'falcon_agents', protocol: 'HTTPS', port: 443, data: 'threat_indicators' },
      { from: 'falcon_agents', to: 'local_processes', protocol: 'Kernel', data: 'process_monitoring' }
    ],
    requiredPermissions: {
      compute: ['root/administrator', 'kernel_module_load']
    }
  },

  'okta': {
    productName: 'Okta Workforce Identity',
    category: 'Identity',
    connectionPattern: {
      type: 'identity_provider',
      direction: 'bidirectional',
      connectsTo: ['compute', 'kubernetes', 'storage', 'external_applications'],
      requiresDirectConnection: false,
      scanMethod: 'authentication_flow'
    },
    architectureIntegration: {
      placement: 'external',
      nestable: false,
      visibility: 'user_access_flows',
      enforcement: 'authentication_authorization',
      requirements: [
        'Okta tenant configured',
        'SAML/OIDC application integrations',
        'MFA policies configured',
        'Network access to Okta (okta.com)'
      ]
    },
    securityRules: [
      {
        id: 'OKTA-001',
        severity: 'critical',
        rule: 'MFA must be enforced for all cloud console access',
        validation: (config) => config.mfaPolicy === 'required' || config.mfaPolicy === 'enforced',
        errorMessage: 'Multi-factor authentication must be enforced for all users accessing cloud resources.'
      },
      {
        id: 'OKTA-002',
        severity: 'critical',
        rule: 'Privileged accounts must use strong authentication',
        validation: (config) => config.privilegedAccountPolicy && config.privilegedAccountPolicy.includes('phishing_resistant'),
        errorMessage: 'Privileged accounts must use phishing-resistant MFA (WebAuthn, FIDO2).'
      },
      {
        id: 'OKTA-003',
        severity: 'high',
        rule: 'Session timeout should be configured for sensitive apps',
        validation: (config) => config.sessionTimeout && config.sessionTimeout <= 480,
        warningMessage: 'Configure session timeout (≤8 hours) for applications accessing sensitive data.'
      },
      {
        id: 'OKTA-004',
        severity: 'medium',
        rule: 'Adaptive authentication should be enabled',
        validation: (config) => config.adaptiveAuth === true,
        warningMessage: 'Enable adaptive authentication for risk-based access control.'
      },
      {
        id: 'OKTA-005',
        severity: 'high',
        rule: 'API tokens must have expiration',
        validation: (config) => config.apiTokenExpiration === true,
        errorMessage: 'Okta API tokens must have expiration dates configured.'
      }
    ],
    protectionCapabilities: {
      sso: true,
      mfa: true,
      adaptiveAuth: true,
      userLifecycle: true,
      apiAccessManagement: true,
      universalDirectory: true
    },
    dataFlows: [
      { from: 'users', to: 'okta', protocol: 'HTTPS', port: 443, data: 'authentication_requests' },
      { from: 'okta', to: 'cloud_console', protocol: 'SAML/OIDC', port: 443, data: 'identity_assertions' },
      { from: 'applications', to: 'okta', protocol: 'HTTPS', port: 443, data: 'authorization_requests' }
    ],
    requiredPermissions: {
      okta: ['API Access Management', 'Application Management']
    }
  },

  'cloudflare_one': {
    productName: 'Cloudflare One',
    category: 'SASE',
    connectionPattern: {
      type: 'edge_proxy',
      direction: 'bidirectional',
      connectsTo: ['compute', 'storage', 'kubernetes', 'external_services'],
      requiresDirectConnection: false,
      scanMethod: 'traffic_inspection'
    },
    architectureIntegration: {
      placement: 'inside_vpc',
      nestable: true,
      nestsInside: ['vpc', 'vnet', 'subnet'],
      connectsTo: ['compute', 'kubernetes'],
      visibility: 'network_traffic_flows',
      enforcement: 'zero_trust_policies',
      requirements: [
        'Cloudflare account with Zero Trust plan',
        'DNS configuration pointing to Cloudflare',
        'WARP client deployment for user endpoints',
        'Tunnel configuration for private resources'
      ]
    },
    securityRules: [
      {
        id: 'CF-001',
        severity: 'critical',
        rule: 'Zero Trust policies must be configured for all applications',
        validation: (config) => config.zeroTrustPolicies && config.zeroTrustPolicies.length > 0,
        errorMessage: 'Configure Zero Trust access policies before exposing applications through Cloudflare.'
      },
      {
        id: 'CF-002',
        severity: 'high',
        rule: 'Gateway DNS filtering should be enabled',
        validation: (config) => config.gatewayDNS === true,
        warningMessage: 'Enable Gateway DNS filtering to block malicious domains and enforce content policies.'
      },
      {
        id: 'CF-003',
        severity: 'high',
        rule: 'HTTP inspection should be enabled for web traffic',
        validation: (config) => config.httpInspection === true,
        warningMessage: 'Enable HTTP inspection to detect threats in encrypted traffic.'
      },
      {
        id: 'CF-004',
        severity: 'medium',
        rule: 'CASB integration should be configured',
        validation: (config) => config.casbIntegration === true,
        warningMessage: 'Enable CASB integration to monitor SaaS application usage and enforce DLP.'
      }
    ],
    protectionCapabilities: {
      ztna: true,
      swg: true,
      casb: true,
      dlp: true,
      firewallAsService: true,
      dnsFiltering: true
    },
    dataFlows: [
      { from: 'users', to: 'cloudflare_edge', protocol: 'HTTPS', port: 443, data: 'user_requests' },
      { from: 'cloudflare_edge', to: 'protected_apps', protocol: 'HTTPS', port: 443, data: 'proxied_requests' },
      { from: 'cloudflare_tunnels', to: 'private_resources', protocol: 'HTTPS', port: 443, data: 'secure_access' }
    ],
    requiredPermissions: {
      cloudflare: ['Account Admin', 'Zero Trust Admin']
    }
  },

  'zscaler': {
    productName: 'Zscaler Zero Trust Exchange',
    category: 'SASE',
    connectionPattern: {
      type: 'cloud_proxy',
      direction: 'bidirectional',
      connectsTo: ['compute', 'storage', 'kubernetes', 'internet'],
      requiresDirectConnection: true,
      scanMethod: 'inline_inspection'
    },
    architectureIntegration: {
      placement: 'inside_vpc',
      nestable: true,
      nestsInside: ['vpc', 'vnet', 'subnet'],
      visibility: 'all_traffic_flows',
      enforcement: 'zero_trust_policies',
      requirements: [
        'Zscaler ZIA and ZPA licenses',
        'App connectors deployed in cloud',
        'Client connector for user endpoints',
        'IPsec tunnels for site-to-site'
      ]
    },
    securityRules: [
      {
        id: 'ZS-001',
        severity: 'critical',
        rule: 'App connectors must be deployed in every cloud region',
        validation: (config, nodes) => {
          const regions = new Set(nodes.filter(n => n.data.region).map(n => n.data.region));
          return config.appConnectors && regions.every(r => config.appConnectors.includes(r));
        },
        errorMessage: 'Deploy Zscaler App Connectors in each cloud region for optimal performance and redundancy.'
      },
      {
        id: 'ZS-002',
        severity: 'critical',
        rule: 'SSL inspection must be enabled',
        validation: (config) => config.sslInspection === true,
        errorMessage: 'Enable SSL inspection to detect threats in encrypted traffic.'
      },
      {
        id: 'ZS-003',
        severity: 'high',
        rule: 'DLP policies should be configured',
        validation: (config) => config.dlpPolicies && config.dlpPolicies.length > 0,
        warningMessage: 'Configure DLP policies to prevent data exfiltration.'
      },
      {
        id: 'ZS-004',
        severity: 'medium',
        rule: 'Cloud firewall rules should be optimized',
        validation: (config) => config.firewallOptimization === true,
        warningMessage: 'Optimize firewall rules to reduce latency and improve performance.'
      }
    ],
    protectionCapabilities: {
      ztna: true,
      swg: true,
      casb: true,
      cloudFirewall: true,
      dlp: true,
      sandboxing: true
    },
    dataFlows: [
      { from: 'users', to: 'zscaler_edge', protocol: 'IPsec/GRE', port: 'various', data: 'user_traffic' },
      { from: 'zscaler_edge', to: 'internet', protocol: 'HTTPS', port: 443, data: 'inspected_traffic' },
      { from: 'app_connectors', to: 'zscaler_cloud', protocol: 'HTTPS', port: 443, data: 'app_registration' },
      { from: 'zscaler_cloud', to: 'private_apps', protocol: 'HTTPS', port: 443, data: 'zero_trust_access' }
    ],
    requiredPermissions: {
      cloud: ['VM deployment', 'Network configuration']
    }
  },

  'datadog': {
    productName: 'Datadog',
    category: 'Observability',
    connectionPattern: {
      type: 'agent_telemetry',
      direction: 'outbound',
      connectsTo: ['compute', 'kubernetes', 'storage', 'database'],
      requiresDirectConnection: true,
      scanMethod: 'metrics_collection'
    },
    architectureIntegration: {
      placement: 'inside_vpc',
      nestable: true,
      nestsInside: ['vpc', 'vnet', 'subnet'],
      visibility: 'all_infrastructure',
      enforcement: 'monitoring_and_alerting',
      requirements: [
        'Datadog agent on all monitored resources',
        'API key and App key configured',
        'Cloud integration for metadata enrichment',
        'Outbound access to Datadog intake (443)'
      ]
    },
    securityRules: [
      {
        id: 'DD-001',
        severity: 'high',
        rule: 'API keys must be rotated regularly',
        validation: (config) => config.keyRotationEnabled === true,
        warningMessage: 'Enable API key rotation (90 days) to limit exposure of compromised keys.'
      },
      {
        id: 'DD-002',
        severity: 'high',
        rule: 'Logs should not contain sensitive data',
        validation: (config) => config.sensitiveDataScanning === true,
        errorMessage: 'Enable sensitive data scanning to prevent PII/secrets from being logged.'
      },
      {
        id: 'DD-003',
        severity: 'medium',
        rule: 'Security monitoring should be enabled',
        validation: (config) => config.securityMonitoring === true,
        warningMessage: 'Enable Datadog Security Monitoring for threat detection and compliance.'
      },
      {
        id: 'DD-004',
        severity: 'medium',
        rule: 'Network Performance Monitoring for distributed systems',
        validation: (config, nodes) => {
          const distributed = nodes.filter(n => n.data.type === 'kubernetes' || n.data.type === 'microservice').length > 0;
          return !distributed || config.npm === true;
        },
        warningMessage: 'Enable Network Performance Monitoring for microservices and Kubernetes.'
      }
    ],
    protectionCapabilities: {
      infrastructureMonitoring: true,
      apm: true,
      logManagement: true,
      securityMonitoring: true,
      npm: true,
      realUserMonitoring: true
    },
    dataFlows: [
      { from: 'datadog_agents', to: 'datadog_intake', protocol: 'HTTPS', port: 443, data: 'metrics_logs_traces' },
      { from: 'cloud_apis', to: 'datadog', protocol: 'HTTPS', port: 443, data: 'resource_metadata' },
      { from: 'datadog', to: 'alert_channels', protocol: 'HTTPS', port: 443, data: 'notifications' }
    ],
    requiredPermissions: {
      aws: ['CloudWatch ReadOnly', 'EC2 ReadOnly'],
      azure: ['Monitoring Reader'],
      gcp: ['Monitoring Viewer']
    }
  },

  'rubrik': {
    productName: 'Rubrik Security Cloud',
    category: 'Resilience',
    connectionPattern: {
      type: 'backup_orchestrator',
      direction: 'bidirectional',
      connectsTo: ['compute', 'storage', 'database', 'kubernetes'],
      requiresDirectConnection: true,
      scanMethod: 'snapshot_based'
    },
    architectureIntegration: {
      placement: 'external',
      nestable: false,
      visibility: 'data_assets',
      enforcement: 'backup_policies',
      requirements: [
        'Rubrik cluster or SaaS connector',
        'Snapshot permissions for all data sources',
        'Immutable storage configuration',
        'Network access for backup traffic'
      ]
    },
    securityRules: [
      {
        id: 'RUB-001',
        severity: 'critical',
        rule: 'Immutable backups must be enabled',
        validation: (config) => config.immutableBackups === true,
        errorMessage: 'Enable immutable backups to protect against ransomware and malicious deletion.'
      },
      {
        id: 'RUB-002',
        severity: 'critical',
        rule: 'Critical databases must have backup SLA < 4 hours',
        validation: (config, nodes) => {
          const databases = nodes.filter(n => n.data.type === 'database');
          return databases.every(db => config.slaConfig && config.slaConfig[db.id] && config.slaConfig[db.id].rpo <= 240);
        },
        errorMessage: 'Configure backup SLA with RPO ≤4 hours for all databases containing sensitive data.'
      },
      {
        id: 'RUB-003',
        severity: 'high',
        rule: 'Backup encryption must be enabled',
        validation: (config) => config.backupEncryption === true,
        errorMessage: 'Enable backup encryption to protect data at rest in backup storage.'
      },
      {
        id: 'RUB-004',
        severity: 'high',
        rule: 'Air-gapped copies should be configured',
        validation: (config) => config.airGappedCopies === true,
        warningMessage: 'Configure air-gapped backup copies for additional ransomware protection.'
      },
      {
        id: 'RUB-005',
        severity: 'medium',
        rule: 'Anomaly detection should be enabled',
        validation: (config) => config.anomalyDetection === true,
        warningMessage: 'Enable anomaly detection to identify potential ransomware attacks on backup data.'
      }
    ],
    protectionCapabilities: {
      backup: true,
      recovery: true,
      immutableStorage: true,
      anomalyDetection: true,
      threatMonitoring: true,
      complianceReporting: true
    },
    dataFlows: [
      { from: 'rubrik', to: 'data_sources', protocol: 'HTTPS/SMB', port: '443/445', data: 'backup_traffic' },
      { from: 'snapshots', to: 'rubrik_storage', protocol: 'HTTPS', port: 443, data: 'deduplicated_data' },
      { from: 'rubrik', to: 'archive_storage', protocol: 'HTTPS', port: 443, data: 'long_term_retention' }
    ],
    requiredPermissions: {
      aws: ['EC2 Snapshot', 'RDS Snapshot', 'S3 Access'],
      azure: ['Backup Contributor', 'Snapshot Contributor'],
      gcp: ['Compute Storage Admin', 'Cloud SQL Admin']
    }
  },

  'vault': {
    productName: 'HashiCorp Vault',
    category: 'Secrets',
    connectionPattern: {
      type: 'secrets_provider',
      direction: 'pull',
      connectsTo: ['compute', 'kubernetes', 'storage', 'database'],
      requiresDirectConnection: true,
      scanMethod: 'api_based'
    },
    architectureIntegration: {
      placement: 'inside_vpc',
      nestable: true,
      nestsInside: ['vpc', 'vnet', 'subnet'],
      visibility: 'secrets_consumers',
      enforcement: 'dynamic_credentials',
      requirements: [
        'Vault server (self-hosted or HCP)',
        'Vault initialized and unsealed',
        'Secret engines configured per cloud',
        'Authentication methods configured'
      ]
    },
    securityRules: [
      {
        id: 'VAULT-001',
        severity: 'critical',
        rule: 'Vault must be deployed with HA configuration',
        validation: (config) => config.highAvailability === true && config.replicas >= 3,
        errorMessage: 'Deploy Vault in HA mode with minimum 3 replicas for production workloads.'
      },
      {
        id: 'VAULT-002',
        severity: 'critical',
        rule: 'Auto-unseal must be configured',
        validation: (config) => config.autoUnseal === true,
        errorMessage: 'Configure auto-unseal using cloud KMS to prevent manual unseal requirements.'
      },
      {
        id: 'VAULT-003',
        severity: 'critical',
        rule: 'Root tokens must be revoked after initial setup',
        validation: (config) => config.rootTokenRevoked === true,
        errorMessage: 'Revoke root tokens after initial configuration. Use auth methods instead.'
      },
      {
        id: 'VAULT-004',
        severity: 'high',
        rule: 'Audit logging must be enabled',
        validation: (config) => config.auditLogging === true,
        errorMessage: 'Enable audit logging to track all Vault access and secret retrieval.'
      },
      {
        id: 'VAULT-005',
        severity: 'high',
        rule: 'Dynamic secrets should be preferred over static',
        validation: (config, nodes) => {
          const databases = nodes.filter(n => n.data.type === 'database');
          return databases.length === 0 || config.dynamicSecretsEnabled === true;
        },
        warningMessage: 'Use Vault dynamic database credentials instead of static passwords.'
      },
      {
        id: 'VAULT-006',
        severity: 'medium',
        rule: 'Secret leases should have short TTL',
        validation: (config) => config.defaultLeaseTTL && config.defaultLeaseTTL <= 3600,
        warningMessage: 'Configure short TTL (≤1 hour) for secrets to limit exposure window.'
      },
      {
        id: 'VAULT-007',
        severity: 'high',
        rule: 'Encryption in transit must be enforced',
        validation: (config) => config.tlsEnabled === true,
        errorMessage: 'Enable TLS for all Vault client connections to protect secrets in transit.'
      }
    ],
    protectionCapabilities: {
      secretsManagement: true,
      dynamicCredentials: true,
      encryptionAsService: true,
      pki: true,
      transitEncryption: true,
      keyManagement: true
    },
    dataFlows: [
      { from: 'applications', to: 'vault', protocol: 'HTTPS', port: 8200, data: 'secret_requests' },
      { from: 'vault', to: 'applications', protocol: 'HTTPS', port: 8200, data: 'secrets_credentials' },
      { from: 'vault', to: 'cloud_iam', protocol: 'API', port: 443, data: 'dynamic_credential_generation' },
      { from: 'vault', to: 'audit_logs', protocol: 'File/Syslog', data: 'access_audit' }
    ],
    requiredPermissions: {
      aws: ['IAM User/Role creation', 'STS AssumeRole'],
      azure: ['Service Principal management'],
      gcp: ['Service Account creation']
    }
  }
};

/**
 * Validate security integration configuration
 */
export function validateIntegrationSecurity(vendorKey, config, nodes = []) {
  const rules = SECURITY_INTEGRATION_RULES[vendorKey];
  if (!rules) return { valid: true, errors: [], warnings: [] };

  const errors = [];
  const warnings = [];

  for (const rule of rules.securityRules) {
    try {
      const isValid = rule.validation(config, nodes);
      
      if (!isValid) {
        if (rule.severity === 'critical' || rule.severity === 'high') {
          errors.push({
            id: rule.id,
            severity: rule.severity,
            rule: rule.rule,
            message: rule.errorMessage || rule.warningMessage
          });
        } else {
          warnings.push({
            id: rule.id,
            severity: rule.severity,
            rule: rule.rule,
            message: rule.warningMessage || rule.errorMessage
          });
        }
      }
    } catch (e) {
      console.error(`Error validating rule ${rule.id}:`, e);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Get required connections for a vendor integration
 */
export function getRequiredConnections(vendorKey, nodes = []) {
  const rules = SECURITY_INTEGRATION_RULES[vendorKey];
  if (!rules) return [];

  const { connectionPattern } = rules;
  const requiredConnections = [];

  // Find nodes that this vendor should connect to
  for (const node of nodes) {
    if (connectionPattern.connectsTo.includes(node.data.type)) {
      requiredConnections.push({
        sourceId: vendorKey,
        targetId: node.id,
        type: connectionPattern.type,
        required: connectionPattern.requiresDirectConnection
      });
    }
  }

  return requiredConnections;
}

/**
 * Check if vendor supports a specific cloud provider
 */
export function isProviderSupported(vendorKey, provider) {
  const rules = SECURITY_INTEGRATION_RULES[vendorKey];
  if (!rules || !rules.requiredPermissions) return true;
  
  return Object.keys(rules.requiredPermissions).includes(provider);
}

export default {
  SECURITY_INTEGRATION_RULES,
  validateIntegrationSecurity,
  getRequiredConnections,
  isProviderSupported
};
