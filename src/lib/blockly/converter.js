/**
 * Terraform Multi-Cloud Converter
 * Converts Terraform code between AWS, Azure, and GCP
 * 
 * Based on Terraform Registry (https://registry.terraform.io/namespaces/hashicorp)
 * Uses official HashiCorp provider documentation for accurate mappings
 * 
 * Registry References:
 * - AWS Provider: https://registry.terraform.io/providers/hashicorp/aws
 * - Azure Provider: https://registry.terraform.io/providers/hashicorp/azurerm
 * - GCP Provider: https://registry.terraform.io/providers/hashicorp/google
 */

/**
 * Get Terraform Registry URL for a resource type
 */
function getRegistryUrl(provider, resourceType) {
  const providerInfo = providerMappings[provider];
  if (!providerInfo) return null;
  
  // Format: https://registry.terraform.io/providers/hashicorp/{provider}/latest/docs/resources/{resource}
  const resourceName = resourceType.replace(/^[^_]+_/, ''); // Remove provider prefix
  return `https://registry.terraform.io/providers/${providerInfo.source}/latest/docs/resources/${resourceName}`;
}

// Resource type mappings between cloud providers
const resourceMappings = {
  // Compute Instances
  'aws_instance': {
    'azurerm': 'azurerm_virtual_machine',
    'google': 'google_compute_instance'
  },
  'azurerm_virtual_machine': {
    'aws': 'aws_instance',
    'google': 'google_compute_instance'
  },
  'google_compute_instance': {
    'aws': 'aws_instance',
    'azurerm': 'azurerm_virtual_machine'
  },
  
  // Security Groups / Firewalls
  'aws_security_group': {
    'azurerm': 'azurerm_network_security_group',
    'google': 'google_compute_firewall'
  },
  'azurerm_network_security_group': {
    'aws': 'aws_security_group',
    'google': 'google_compute_firewall'
  },
  'google_compute_firewall': {
    'aws': 'aws_security_group',
    'azurerm': 'azurerm_network_security_group'
  },
  
  // Networks / VPCs
  'aws_vpc': {
    'azurerm': 'azurerm_virtual_network',
    'google': 'google_compute_network',
    'aviatrix': 'aviatrix_vpc'
  },
  'azurerm_virtual_network': {
    'aws': 'aws_vpc',
    'google': 'google_compute_network',
    'aviatrix': 'aviatrix_vpc'
  },
  'google_compute_network': {
    'aws': 'aws_vpc',
    'azurerm': 'azurerm_virtual_network',
    'aviatrix': 'aviatrix_vpc'
  },
  'aviatrix_vpc': {
    'aws': 'aws_vpc',
    'azurerm': 'azurerm_virtual_network',
    'google': 'google_compute_network'
  },
  
  // Subnets
  'aws_subnet': {
    'azurerm': 'azurerm_subnet',
    'google': 'google_compute_subnetwork'
  },
  'azurerm_subnet': {
    'aws': 'aws_subnet',
    'google': 'google_compute_subnetwork'
  },
  'google_compute_subnetwork': {
    'aws': 'aws_subnet',
    'azurerm': 'azurerm_subnet'
  },
  
  // Storage
  'aws_s3_bucket': {
    'azurerm': 'azurerm_storage_account',
    'google': 'google_storage_bucket'
  },
  'azurerm_storage_account': {
    'aws': 'aws_s3_bucket',
    'google': 'google_storage_bucket'
  },
  'google_storage_bucket': {
    'aws': 'aws_s3_bucket',
    'azurerm': 'azurerm_storage_account'
  },
  
  // Load Balancers
  'aws_lb': {
    'azurerm': 'azurerm_lb',
    'google': 'google_compute_backend_service'
  },
  'azurerm_lb': {
    'aws': 'aws_lb',
    'google': 'google_compute_backend_service'
  },
  'google_compute_backend_service': {
    'aws': 'aws_lb',
    'azurerm': 'azurerm_lb'
  },
  
  // Databases
  'aws_db_instance': {
    'azurerm': 'azurerm_mysql_server',
    'google': 'google_sql_database_instance'
  },
  'azurerm_mysql_server': {
    'aws': 'aws_db_instance',
    'google': 'google_sql_database_instance'
  },
  'google_sql_database_instance': {
    'aws': 'aws_db_instance',
    'azurerm': 'azurerm_mysql_server'
  },
  
  // Key Management
  'aws_kms_key': {
    'azurerm': 'azurerm_key_vault_key',
    'google': 'google_kms_crypto_key'
  },
  'azurerm_key_vault_key': {
    'aws': 'aws_kms_key',
    'google': 'google_kms_crypto_key'
  },
  'google_kms_crypto_key': {
    'aws': 'aws_kms_key',
    'azurerm': 'azurerm_key_vault_key'
  },
  
  // IAM / Identity
  'aws_iam_role': {
    'azurerm': 'azurerm_role_definition',
    'google': 'google_project_iam_custom_role'
  },
  'azurerm_role_definition': {
    'aws': 'aws_iam_role',
    'google': 'google_project_iam_custom_role'
  },
  'google_project_iam_custom_role': {
    'aws': 'aws_iam_role',
    'azurerm': 'azurerm_role_definition'
  },
  
  // Container Services
  'aws_ecs_cluster': {
    'azurerm': 'azurerm_container_group',
    'google': 'google_container_cluster'
  },
  'azurerm_container_group': {
    'aws': 'aws_ecs_cluster',
    'google': 'google_container_cluster'
  },
  'google_container_cluster': {
    'aws': 'aws_ecs_cluster',
    'azurerm': 'azurerm_container_group'
  },
  
  // Functions / Serverless
  'aws_lambda_function': {
    'azurerm': 'azurerm_function_app',
    'google': 'google_cloudfunctions_function'
  },
  'azurerm_function_app': {
    'aws': 'aws_lambda_function',
    'google': 'google_cloudfunctions_function'
  },
  'google_cloudfunctions_function': {
    'aws': 'aws_lambda_function',
    'azurerm': 'azurerm_function_app'
  },
  
  // DNS
  'aws_route53_zone': {
    'azurerm': 'azurerm_dns_zone',
    'google': 'google_dns_managed_zone'
  },
  'azurerm_dns_zone': {
    'aws': 'aws_route53_zone',
    'google': 'google_dns_managed_zone'
  },
  'google_dns_managed_zone': {
    'aws': 'aws_route53_zone',
    'azurerm': 'azurerm_dns_zone'
  },
  
  // Resource Groups (Azure-specific, but useful for organization)
  'azurerm_resource_group': {
    'aws': null, // AWS doesn't have resource groups, use tags
    'google': null // GCP uses projects/folders
  }
};

// Provider mappings based on Terraform Registry
const providerMappings = {
  'aws': {
    source: 'hashicorp/aws',
    namespace: 'hashicorp',
    type: 'aws',
    defaultVersion: '~> 5.0'
  },
  'azurerm': {
    source: 'hashicorp/azurerm',
    namespace: 'hashicorp',
    type: 'azurerm',
    defaultVersion: '~> 3.0'
  },
  'google': {
    source: 'hashicorp/google',
    namespace: 'hashicorp',
    type: 'google',
    defaultVersion: '~> 5.0'
  },
  'aviatrix': {
    source: 'AviatrixSystems/aviatrix',
    namespace: 'AviatrixSystems',
    type: 'aviatrix',
    defaultVersion: '~> 8.2', // Latest as of Dec 2025 per https://github.com/AviatrixSystems/terraform-provider-aviatrix
    registrySource: 'aviatrix.com/aviatrix/aviatrix' // For Terraform 0.13+
  }
};

// Comprehensive attribute mappings based on Terraform Registry documentation
// Reference: https://registry.terraform.io/namespaces/hashicorp
const attributeMappings = {
  // Instance attributes (based on registry.terraform.io providers)
  'aws_instance': {
    'azurerm_virtual_machine': {
      'ami': 'storage_image_reference.0.id',
      'instance_type': 'vm_size',
      'tags': 'tags',
      'user_data': 'os_profile.0.custom_data',
      'key_name': 'os_profile_linux_config.0.ssh_keys',
      'vpc_security_group_ids': 'network_interface.0.network_security_group_id'
    },
    'google_compute_instance': {
      'ami': 'boot_disk.0.initialize_params.0.image',
      'instance_type': 'machine_type',
      'tags': 'labels',
      'user_data': 'metadata_startup_script',
      'key_name': 'metadata.ssh-keys',
      'vpc_security_group_ids': 'network_interface.0.network'
    }
  },
  
  // Security Group / Firewall attributes
  'aws_security_group': {
    'azurerm_network_security_group': {
      'ingress': 'security_rule (access = "Allow", direction = "Inbound")',
      'egress': 'security_rule (access = "Allow", direction = "Outbound")',
      'name': 'name',
      'description': 'description'
    },
    'google_compute_firewall': {
      'ingress': 'allow (direction = "INGRESS")',
      'egress': 'allow (direction = "EGRESS")',
      'name': 'name',
      'description': 'description'
    }
  },
  
  // Network / VPC attributes
  'aws_vpc': {
    'azurerm_virtual_network': {
      'cidr_block': 'address_space.0',
      'tags': 'tags',
      'enable_dns_hostnames': null, // Azure handles this differently
      'enable_dns_support': null
    },
    'google_compute_network': {
      'cidr_block': 'auto_create_subnetworks = false (use subnets)',
      'tags': 'labels'
    }
  },
  
  // Subnet attributes
  'aws_subnet': {
    'azurerm_subnet': {
      'cidr_block': 'address_prefixes.0',
      'vpc_id': 'virtual_network_name',
      'availability_zone': 'availability_zone',
      'tags': 'tags'
    },
    'google_compute_subnetwork': {
      'cidr_block': 'ip_cidr_range',
      'vpc_id': 'network',
      'availability_zone': 'region',
      'tags': null // GCP uses network tags differently
    }
  },
  
  // Storage attributes
  'aws_s3_bucket': {
    'azurerm_storage_account': {
      'bucket': 'name',
      'acl': null, // Azure uses different access control
      'versioning': 'blob_properties.0.versioning_enabled',
      'tags': 'tags'
    },
    'google_storage_bucket': {
      'bucket': 'name',
      'location': 'location',
      'storage_class': 'storage_class',
      'labels': 'labels'
    }
  }
};

// Data source mappings (from Terraform Registry)
const dataSourceMappings = {
  'aws_ami': {
    'azurerm': 'azurerm_image',
    'google': 'google_compute_image'
  },
  'azurerm_image': {
    'aws': 'aws_ami',
    'google': 'google_compute_image'
  },
  'google_compute_image': {
    'aws': 'aws_ami',
    'azurerm': 'azurerm_image'
  }
};

/**
 * Detect the source platform from Terraform code
 * Enhanced detection based on Terraform Registry provider patterns
 */
export function detectPlatform(hclString) {
  // Check for provider blocks first (most reliable)
  if (hclString.match(/provider\s+"aws"/i)) {
    return 'aws';
  } else if (hclString.match(/provider\s+"azurerm"/i)) {
    return 'azurerm';
  } else if (hclString.match(/provider\s+"google"/i)) {
    return 'google';
  } else if (hclString.match(/provider\s+"aviatrix"/i)) {
    return 'aviatrix';
  }
  
  // Check for required_providers
  if (hclString.match(/required_providers\s*\{[^}]*aws\s*=/i)) {
    return 'aws';
  } else if (hclString.match(/required_providers\s*\{[^}]*azurerm\s*=/i)) {
    return 'azurerm';
  } else if (hclString.match(/required_providers\s*\{[^}]*google\s*=/i)) {
    return 'google';
  } else if (hclString.match(/required_providers\s*\{[^}]*aviatrix\s*=/i)) {
    return 'aviatrix';
  }
  
  // Check for resource/data source patterns
  const awsCount = (hclString.match(/\baws_[a-z_]+/g) || []).length;
  const azureCount = (hclString.match(/\bazurerm_[a-z_]+/g) || []).length;
  const googleCount = (hclString.match(/\bgoogle_[a-z_]+/g) || []).length;
  const aviatrixCount = (hclString.match(/\baviatrix_[a-z_]+/g) || []).length;
  
  if (awsCount > azureCount && awsCount > googleCount && awsCount > aviatrixCount) {
    return 'aws';
  } else if (azureCount > awsCount && azureCount > googleCount && azureCount > aviatrixCount) {
    return 'azurerm';
  } else if (googleCount > awsCount && googleCount > azureCount && googleCount > aviatrixCount) {
    return 'google';
  } else if (aviatrixCount > awsCount && aviatrixCount > azureCount && aviatrixCount > googleCount) {
    return 'aviatrix';
  }
  
  return null;
}

/**
 * Convert resource type from source to target platform
 */
function convertResourceType(resourceType, targetPlatform) {
  // Extract provider prefix
  let sourceProvider = null;
  if (resourceType.startsWith('aws_')) {
    sourceProvider = 'aws';
  } else if (resourceType.startsWith('azurerm_')) {
    sourceProvider = 'azurerm';
  } else if (resourceType.startsWith('google_')) {
    sourceProvider = 'google';
  } else if (resourceType.startsWith('aviatrix_')) {
    sourceProvider = 'aviatrix';
  }
  
  if (!sourceProvider || sourceProvider === targetPlatform) {
    return resourceType; // No conversion needed
  }
  
  const mapping = resourceMappings[resourceType];
  if (mapping && mapping[targetPlatform]) {
    return mapping[targetPlatform];
  }
  
  return resourceType; // Return original if no mapping found
}

/**
 * Convert provider configuration
 */
function convertProvider(providerName, targetPlatform) {
  if (providerName === targetPlatform) {
    return providerName;
  }
  
  return targetPlatform;
}

/**
 * Convert resource references in attribute values
 */
function convertReferences(value, sourcePlatform, targetPlatform) {
  if (typeof value !== 'string') {
    return value;
  }
  
  // Convert resource references
  const sourcePrefix = sourcePlatform === 'aws' ? 'aws_' : 
                       sourcePlatform === 'azurerm' ? 'azurerm_' : 'google_';
  const targetPrefix = targetPlatform === 'aws' ? 'aws_' : 
                       targetPlatform === 'azurerm' ? 'azurerm_' : 'google_';
  
  // Simple reference conversion (basic - can be enhanced)
  if (value.includes(sourcePrefix)) {
    // This is a simplified conversion - in reality, we'd need to track resource names
    // and convert them properly
    return value.replace(new RegExp(sourcePrefix, 'g'), targetPrefix);
  }
  
  return value;
}

/**
 * Main conversion function
 */
export function convertTerraform(hclString, sourcePlatform, targetPlatform) {
  if (sourcePlatform === targetPlatform) {
    return hclString; // No conversion needed
  }
  
  let converted = hclString;
  
  // 1. Convert provider blocks
  const sourceProvider = sourcePlatform === 'aws' ? 'aws' : 
                        sourcePlatform === 'azurerm' ? 'azurerm' : 
                        sourcePlatform === 'google' ? 'google' : 'aviatrix';
  const targetProvider = targetPlatform === 'aws' ? 'aws' : 
                        targetPlatform === 'azurerm' ? 'azurerm' : 
                        targetPlatform === 'google' ? 'google' : 'aviatrix';
  
  converted = converted.replace(
    new RegExp(`provider\\s+"${sourceProvider}"`, 'g'),
    `provider "${targetProvider}"`
  );
  
  // 2. Convert resource types and their references
  // First, collect all resource names for reference conversion
  const resourceNameMap = new Map();
  
  Object.keys(resourceMappings).forEach(sourceType => {
    const mapping = resourceMappings[sourceType];
    if (mapping && mapping[targetPlatform]) {
      const targetType = mapping[targetPlatform];
      
      // Find all resource declarations and map their names
      const resourceDeclRegex = new RegExp(`resource\\s+"${sourceType.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"\\s+"([^"]+)"`, 'g');
      let match;
      while ((match = resourceDeclRegex.exec(converted)) !== null) {
        const resourceName = match[1];
        resourceNameMap.set(`${sourceType}.${resourceName}`, `${targetType}.${resourceName}`);
      }
      
      // Replace resource declarations
      converted = converted.replace(
        new RegExp(`resource\\s+"${sourceType.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"\\s+"([^"]+)"`, 'g'),
        `resource "${targetType}" "$1"`
      );
    }
  });
  
  // 3. Convert resource references throughout the code
  resourceNameMap.forEach((targetRef, sourceRef) => {
    // Match various reference patterns
    const patterns = [
      new RegExp(`\\b${sourceRef.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g'), // Direct reference
      new RegExp(`"${sourceRef.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'g'), // Quoted reference
      new RegExp(`\\[${sourceRef.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]`, 'g') // In list
    ];
    
    patterns.forEach(pattern => {
      converted = converted.replace(pattern, (match) => {
        return match.replace(sourceRef, targetRef);
      });
    });
  });
  
  // 4. Convert data source types (based on Terraform Registry mappings)
  Object.keys(dataSourceMappings).forEach(sourceDataSource => {
    const mapping = dataSourceMappings[sourceDataSource];
    if (mapping && mapping[targetPlatform]) {
      const targetDataSource = mapping[targetPlatform];
      // Replace data source declarations
      converted = converted.replace(
        new RegExp(`data\\s+"${sourceDataSource.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"\\s+"([^"]+)"`, 'g'),
        `data "${targetDataSource}" "$1"`
      );
      
      // Replace data source references
      converted = converted.replace(
        new RegExp(`data\\.${sourceDataSource.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\.([a-zA-Z0-9_]+)`, 'g'),
        `data.${targetDataSource}.$1`
      );
    }
  });
  
  // Also handle generic data source prefix conversion for unmapped types
  const dataSourcePrefix = sourcePlatform === 'aws' ? 'aws_' : 
                          sourcePlatform === 'azurerm' ? 'azurerm_' : 'google_';
  const targetDataSourcePrefix = targetPlatform === 'aws' ? 'aws_' : 
                                 targetPlatform === 'azurerm' ? 'azurerm_' : 'google_';
  
  // Only convert if not already handled by specific mappings
  converted = converted.replace(
    new RegExp(`data\\s+"${dataSourcePrefix}([^"]+)"`, 'g'),
    (match, resourceType) => {
      // Check if this was already converted
      if (!match.includes(targetDataSourcePrefix)) {
        return `data "${targetDataSourcePrefix}${resourceType}"`;
      }
      return match;
    }
  );
  
  // 5. Convert terraform required_providers block (based on Terraform Registry format)
  // Use a more careful approach to avoid extra braces
  // First, find and replace the provider name inside required_providers
  converted = converted.replace(
    /terraform\s*\{([^}]*required_providers\s*\{[^}]*)(\w+)\s*=\s*\{[^}]*source\s*=\s*"[^"]+"[^}]*\}([^}]*)\}([^}]*)\}/g,
    (match, before, oldProvider, after, end) => {
      const providerInfo = providerMappings[targetPlatform];
      return `terraform {\n${before}${targetPlatform} = {\n      source  = "${providerInfo.source}"\n      version = "${providerInfo.defaultVersion}"\n    }${after}\n  }${end}}`;
    }
  );
  
  // Simpler fallback: just replace the provider name and source
  converted = converted.replace(
    /(\w+)\s*=\s*\{\s*source\s*=\s*"hashicorp\/\w+"/g,
    (match, providerName) => {
      if (providerName === sourceProvider) {
        const providerInfo = providerMappings[targetPlatform];
        return `${targetPlatform} = {\n      source  = "${providerInfo.source}"\n      version = "${providerInfo.defaultVersion}"`;
      }
      return match;
    }
  );
  
  // If no terraform block exists, add one
  if (!converted.includes('terraform {')) {
    const providerInfo = providerMappings[targetPlatform];
    converted = `terraform {\n  required_providers {\n    ${targetPlatform} = {\n      source  = "${providerInfo.source}"\n      version = "${providerInfo.defaultVersion}"\n    }\n  }\n}\n\n` + converted;
  }
  
  // 6. Convert common attribute names
  // Note: This is a simplified conversion - real conversion would need more context
  if (sourcePlatform === 'aws' && targetPlatform === 'azurerm') {
    // AWS to Azure conversions
    converted = converted.replace(/\btags\s*=\s*\{/g, 'tags = {');
  } else if (sourcePlatform === 'aws' && targetPlatform === 'google') {
    // AWS to GCP conversions
    converted = converted.replace(/\btags\s*=\s*\{/g, 'labels = {');
  } else if (sourcePlatform === 'azurerm' && targetPlatform === 'google') {
    // Azure to GCP conversions
    converted = converted.replace(/\btags\s*=\s*\{/g, 'labels = {');
  } else if (sourcePlatform === 'google' && targetPlatform === 'aws') {
    // GCP to AWS conversions
    converted = converted.replace(/\blabels\s*=\s*\{/g, 'tags = {');
  } else if (sourcePlatform === 'google' && targetPlatform === 'azurerm') {
    // GCP to Azure conversions
    converted = converted.replace(/\blabels\s*=\s*\{/g, 'tags = {');
  }
  
  // 7. Attribute conversion DISABLED
  // Complex attribute conversions (like ami -> storage_image_reference.0.id) require
  // nested block structures and cannot be done with simple string replacement.
  // These conversions break HCL syntax and must be done manually.
  // 
  // Users should refer to Terraform Registry documentation for proper attribute mapping:
  // - AWS: https://registry.terraform.io/providers/hashicorp/aws
  // - Azure: https://registry.terraform.io/providers/hashicorp/azurerm  
  // - GCP: https://registry.terraform.io/providers/hashicorp/google
  
  // 8. Add comprehensive conversion notice with Terraform Registry references
  const providerInfo = providerMappings[targetPlatform];
  const notice = `# ============================================\n# Converted from ${sourcePlatform.toUpperCase()} to ${targetPlatform.toUpperCase()}\n# Generated using Terraform Registry mappings\n# Registry: https://registry.terraform.io/namespaces/hashicorp\n# ============================================\n# IMPORTANT: Please review and manually adjust:\n#\n# 1. Provider Configuration:\n#    - Source: ${providerInfo.source}\n#    - Update provider credentials and region/location\n#    - Verify provider version compatibility\n#\n# 2. Resource Attributes:\n#    - Some attributes may need manual conversion\n#    - Check Terraform Registry docs for each resource:\n#      https://registry.terraform.io/providers/${providerInfo.source}\n#\n# 3. Provider-Specific Features:\n#    - Some features may not have direct equivalents\n#    - Review resource documentation carefully\n#\n# 4. Testing:\n#    - Always test in a non-production environment first\n#    - Validate all resource configurations\n#    - Check for deprecated attributes\n#\n# 5. Common Conversions:\n#    - Tags (AWS/Azure) ↔ Labels (GCP)\n#    - Security Groups ↔ Network Security Groups ↔ Firewalls\n#    - VPCs ↔ Virtual Networks ↔ Compute Networks\n#\n# ============================================\n\n`;
  converted = notice + converted;
  
  return converted;
}

