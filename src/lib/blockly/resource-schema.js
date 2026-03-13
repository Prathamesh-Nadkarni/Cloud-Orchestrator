/**
 * Terraform Resource Schema and Validation
 * Defines required attributes, color coding, and allowed vendors
 */

// Allowed vendor prefixes
export const ALLOWED_VENDORS = {
  'aws': {
    name: 'AWS',
    prefix: 'aws_',
    color: '#FF9900',
    registry: 'hashicorp/aws'
  },
  'azurerm': {
    name: 'Azure',
    prefix: 'azurerm_',
    color: '#0089D6',
    registry: 'hashicorp/azurerm'
  },
  'google': {
    name: 'GCP',
    prefix: 'google_',
    color: '#4285F4',
    registry: 'hashicorp/google'
  },
  'aviatrix': {
    name: 'Aviatrix',
    prefix: 'aviatrix_',
    color: '#E50914',
    registry: 'AviatrixSystems/aviatrix',
    registrySource: 'aviatrix.com/aviatrix/aviatrix' // For Terraform 0.13+
  }
};

// Resource type categories and their colors
export const RESOURCE_CATEGORIES = {
  compute: {
    name: 'Compute',
    color: '#FF6B6B',
    patterns: ['instance', 'vm', 'function', 'lambda', 'container', 'kubernetes', 'cluster']
  },
  network: {
    name: 'Network',
    color: '#4ECDC4',
    patterns: ['vpc', 'subnet', 'network', 'security_group', 'firewall', 'load_balancer', 'gateway', 'route', 'nat']
  },
  storage: {
    name: 'Storage',
    color: '#95E1D3',
    patterns: ['bucket', 'volume', 'disk', 'storage', 's3', 'blob', 'file']
  },
  database: {
    name: 'Database',
    color: '#F38181',
    patterns: ['db', 'database', 'rds', 'sql', 'dynamodb', 'cosmos']
  },
  security: {
    name: 'Security',
    color: '#AA96DA',
    patterns: ['iam', 'policy', 'role', 'certificate', 'key', 'secret', 'vault']
  },
  monitoring: {
    name: 'Monitoring',
    color: '#FCBAD3',
    patterns: ['monitor', 'log', 'metric', 'alert', 'cloudwatch', 'insights']
  },
  other: {
    name: 'Other',
    color: '#95A5A6',
    patterns: []
  }
};

// Common resource schemas with required attributes
export const RESOURCE_SCHEMAS = {
  // AWS Resources
  'aws_instance': {
    vendor: 'aws',
    category: 'compute',
    required: ['ami', 'instance_type'],
    optional: ['vpc_security_group_ids', 'subnet_id', 'key_name', 'tags', 'user_data']
  },
  'aws_security_group': {
    vendor: 'aws',
    category: 'network',
    required: ['name'],
    optional: ['description', 'vpc_id', 'ingress', 'egress', 'tags']
  },
  'aws_vpc': {
    vendor: 'aws',
    category: 'network',
    required: ['cidr_block'],
    optional: ['enable_dns_hostnames', 'enable_dns_support', 'tags']
  },
  'aws_subnet': {
    vendor: 'aws',
    category: 'network',
    required: ['vpc_id', 'cidr_block'],
    optional: ['availability_zone', 'map_public_ip_on_launch', 'tags']
  },
  'aws_s3_bucket': {
    vendor: 'aws',
    category: 'storage',
    required: [],
    optional: ['bucket', 'acl', 'versioning', 'tags']
  },

  // Azure Resources
  'azurerm_virtual_machine': {
    vendor: 'azurerm',
    category: 'compute',
    required: ['name', 'resource_group_name', 'location', 'network_interface_ids', 'vm_size'],
    optional: ['storage_image_reference', 'storage_os_disk', 'os_profile', 'tags']
  },
  'azurerm_network_security_group': {
    vendor: 'azurerm',
    category: 'network',
    required: ['name', 'resource_group_name', 'location'],
    optional: ['security_rule', 'tags']
  },
  'azurerm_virtual_network': {
    vendor: 'azurerm',
    category: 'network',
    required: ['name', 'resource_group_name', 'location', 'address_space'],
    optional: ['dns_servers', 'tags']
  },
  'azurerm_subnet': {
    vendor: 'azurerm',
    category: 'network',
    required: ['name', 'resource_group_name', 'virtual_network_name', 'address_prefixes'],
    optional: ['service_endpoints', 'tags']
  },
  'azurerm_resource_group': {
    vendor: 'azurerm',
    category: 'other',
    required: ['name', 'location'],
    optional: ['tags']
  },

  // GCP Resources
  'google_compute_instance': {
    vendor: 'google',
    category: 'compute',
    required: ['name', 'machine_type', 'zone'],
    optional: ['boot_disk', 'network_interface', 'tags', 'labels']
  },
  'google_compute_firewall': {
    vendor: 'google',
    category: 'network',
    required: ['name', 'network'],
    optional: ['allow', 'deny', 'source_ranges', 'target_tags']
  },
  'google_compute_network': {
    vendor: 'google',
    category: 'network',
    required: ['name'],
    optional: ['auto_create_subnetworks', 'routing_mode']
  },
  'google_compute_subnetwork': {
    vendor: 'google',
    category: 'network',
    required: ['name', 'ip_cidr_range', 'network'],
    optional: ['region', 'private_ip_google_access']
  },
  'google_storage_bucket': {
    vendor: 'google',
    category: 'storage',
    required: ['name'],
    optional: ['location', 'storage_class', 'labels']
  },

  // Aviatrix Resources - Based on https://github.com/AviatrixSystems/terraform-provider-aviatrix
  'aviatrix_account': {
    vendor: 'aviatrix',
    category: 'other',
    required: ['account_name', 'cloud_type'],
    optional: ['aws_account_number', 'aws_iam', 'aws_role_arn', 'aws_role_ec2', 'aws_access_key', 'aws_secret_key', 'awsgov_account_number', 'awsgov_iam', 'awsgov_role_arn', 'awsgov_role_ec2', 'azure_subscription_id', 'azure_application_id', 'azure_application_key', 'azure_directory_id', 'gcloud_project_id', 'gcloud_project_credentials_filepath']
  },
  'aviatrix_vpc': {
    vendor: 'aviatrix',
    category: 'network',
    required: ['cloud_type', 'account_name', 'region', 'name', 'cidr'],
    optional: ['subnets', 'aviatrix_transit_vpc', 'aviatrix_firenet_vpc', 'aviatrix_firewall_vpc', 'tag_list', 'num_of_subnet_pairs', 'subnet_size']
  },
  'aviatrix_transit_gateway': {
    vendor: 'aviatrix',
    category: 'network',
    required: ['cloud_type', 'account_name', 'gw_name', 'vpc_id', 'vpc_reg', 'gw_size', 'subnet'],
    optional: ['ha_subnet', 'ha_gw_size', 'ha_zone', 'tag_list', 'enable_hybrid_connection', 'enable_firenet', 'enable_transit_firenet', 'enable_segmentation', 'enable_multi_tier_transit', 'local_as_number', 'prepend_as_path', 'bgp_manual_spoke_advertise_cidrs', 'enable_bgp_over_lan', 'bgp_lan_interfaces', 'enable_learned_cidrs_approval', 'learned_cidrs_approval_mode', 'approved_learned_cidrs', 'enable_preserve_as_path', 'bgp_ecmp', 'enable_active_standby', 'enable_active_standby_preemptive', 'enable_monitor_gateway_subnets', 'monitor_exclude_list', 'enable_jumbo_frame', 'enable_private_oob', 'oob_management_subnet', 'enable_vpc_dns_server', 'enable_advertise_transit_cidr', 'bgp_polling_time', 'bgp_hold_time', 'enable_encrypt_volume', 'customized_spoke_vpc_routes', 'filtered_spoke_vpc_routes', 'excluded_advertised_spoke_routes', 'enable_spot_instance', 'spot_price', 'azure_eip_name_resource_group', 'enable_gro_gso']
  },
  'aviatrix_spoke_gateway': {
    vendor: 'aviatrix',
    category: 'network',
    required: ['cloud_type', 'account_name', 'gw_name', 'vpc_id', 'vpc_reg', 'gw_size', 'subnet'],
    optional: ['ha_subnet', 'ha_gw_size', 'ha_zone', 'transit_gw', 'tag_list', 'enable_active_mesh', 'enable_private_oob', 'oob_management_subnet', 'prepend_as_path', 'local_as_number', 'bgp_manual_spoke_advertise_cidrs', 'enable_learned_cidrs_approval', 'learned_cidrs_approval_mode', 'approved_learned_cidrs', 'enable_bgp_over_lan', 'bgp_lan_interfaces', 'enable_encrypt_volume', 'customized_spoke_vpc_routes', 'filtered_spoke_vpc_routes', 'excluded_advertised_spoke_routes', 'enable_spot_instance', 'spot_price', 'azure_eip_name_resource_group', 'enable_gro_gso', 'enable_monitor_gateway_subnets', 'monitor_exclude_list', 'enable_jumbo_frame', 'enable_vpc_dns_server', 'manage_transit_gateway_attachment', 'enable_auto_advertise_s2c_cidrs']
  },
  'aviatrix_gateway': {
    vendor: 'aviatrix',
    category: 'network',
    required: ['gw_name', 'vpc_id', 'vpc_reg', 'gw_size'],
    optional: ['account_name', 'subnet', 'tag_list', 'enable_designated_gateway', 'enable_elb', 'enable_vpc_dns_server', 'enable_encrypt_volume', 'single_ip_snat', 'enable_jumbo_frame', 'enable_ldap', 'enable_monitor_gateway_subnets', 'monitor_exclude_list', 'enable_public_subnet_filtering', 'public_subnet_filtering_route_tables', 'vpc_dns_server_ips', 'enable_vpn_nat', 'vpn_access', 'vpn_cidr', 'max_vpn_conn', 'elb_name', 'additional_cidrs_designated_gateway', 'customer_managed_keys', 'ldap_server', 'ldap_bind_dn', 'ldap_password', 'ldap_base_dn', 'ldap_username_attribute', 'ldap_additional_req', 'enable_spot_instance', 'spot_price', 'azure_eip_name_resource_group', 'enable_gro_gso']
  },
  'aviatrix_spoke_transit_attachment': {
    vendor: 'aviatrix',
    category: 'network',
    required: ['spoke_gw_name', 'transit_gw_name'],
    optional: ['route_tables', 'enable_max_performance', 'enable_over_private_network']
  },
  'aviatrix_transit_external_device_conn': {
    vendor: 'aviatrix',
    category: 'network',
    required: ['vpc_id', 'connection_name', 'gw_name', 'remote_gateway_ip', 'pre_shared_key'],
    optional: ['remote_subnet', 'local_tunnel_cidr', 'remote_tunnel_cidr', 'remote_gateway_latitude', 'remote_gateway_longitude', 'backup_remote_gateway_ip', 'backup_pre_shared_key', 'custom_algorithms', 'phase1_authentication', 'phase1_dh_groups', 'phase1_encryption', 'phase2_authentication', 'phase2_dh_groups', 'phase2_encryption', 'enable_ikev2', 'enable_event_triggered_ha', 'enable_dead_peer_detection', 'ha_enabled', 'bgp_local_as_num', 'bgp_remote_as_num', 'remote_cidr', 'local_lan_cidr', 'remote_lan_cidr', 'enable_learned_cidrs_approval', 'approved_cidrs', 'tunnel_protocol', 'enable_global_accelerator']
  },
  'aviatrix_vgw_conn': {
    vendor: 'aviatrix',
    category: 'network',
    required: ['conn_name', 'gw_name', 'vpc_id', 'bgp_vgw_id', 'bgp_vgw_account', 'bgp_vgw_region', 'bgp_local_as_num'],
    optional: ['enable_learned_cidrs_approval', 'prepend_as_path', 'bgp_manual_spoke_advertise_cidrs']
  },
  'aviatrix_transit_peer': {
    vendor: 'aviatrix',
    category: 'network',
    required: ['peering_ha_gw_name', 'peering_ha_gw_name2'],
    optional: ['peering_ha_subnet', 'peering_ha_zone', 'peering_ha_insane_mode_az', 'peering_ha_gw_size', 'peering_ha_private_mode_lb_vpc_id', 'peering_ha_private_mode_subnet', 'enable_peering_over_private_network', 'enable_insane_mode_encryption_over_internet', 'enable_peering_ha', 'enable_single_tunnel_mode', 'tunnel_count']
  },
  'aviatrix_firewall_instance': {
    vendor: 'aviatrix',
    category: 'security',
    required: ['vpc_id', 'firewall_name', 'firewall_image', 'firewall_image_version', 'firewall_size', 'egress_subnet', 'firewall_tag'],
    optional: ['management_subnet', 'key_name', 'iam_role', 'bootstrap_bucket_name', 'username', 'password', 'ssh_public_key', 'user_data', 'availability_domain', 'fault_domain', 'firewall_image_id']
  },
  'aviatrix_firenet': {
    vendor: 'aviatrix',
    category: 'security',
    required: ['vpc_id'],
    optional: ['firewall_instance_association', 'inspection_enabled', 'egress_enabled', 'keep_alive_via_lan_interface_enabled', 'tgw_segmentation_for_egress_enabled', 'manage_firewall_instance_association', 'manage_firewall_instance']
  },
  'aviatrix_firewall_policy': {
    vendor: 'aviatrix',
    category: 'security',
    required: ['firewall_name', 'src_ip', 'dst_ip', 'protocol', 'log_enabled', 'action'],
    optional: ['port', 'description', 'position']
  },
  'aviatrix_fqdn': {
    vendor: 'aviatrix',
    category: 'security',
    required: ['fqdn_tag', 'fqdn_enabled', 'fqdn_mode'],
    optional: ['fqdn_status', 'fqdn_filter', 'gw_filter_tag_list', 'source_ip_list', 'domain_names']
  },
  'aviatrix_fqdn_tag_rule': {
    vendor: 'aviatrix',
    category: 'security',
    required: ['fqdn_tag_name', 'fqdn', 'protocol', 'port', 'action'],
    optional: ['name']
  },
  'aviatrix_site2cloud': {
    vendor: 'aviatrix',
    category: 'network',
    required: ['vpc_id', 'connection_name', 'remote_gateway_type', 'remote_gateway_ip', 'pre_shared_key', 'remote_subnet_cidr', 'local_subnet_cidr'],
    optional: ['remote_gateway_latitude', 'remote_gateway_longitude', 'backup_remote_gateway_ip', 'backup_pre_shared_key', 'backup_remote_subnet_cidr', 'custom_algorithms', 'phase1_authentication', 'phase1_dh_groups', 'phase1_encryption', 'phase2_authentication', 'phase2_dh_groups', 'phase2_encryption', 'enable_ikev2', 'enable_event_triggered_ha', 'enable_dead_peer_detection', 'ha_enabled', 'bgp_local_as_num', 'bgp_remote_as_num', 'remote_cidr', 'local_lan_cidr', 'remote_lan_cidr', 'enable_learned_cidrs_approval', 'approved_cidrs', 'tunnel_protocol', 'enable_global_accelerator']
  },
  'aviatrix_smart_group': {
    vendor: 'aviatrix',
    category: 'security',
    required: ['name', 'selector'],
    optional: ['uuid']
  },
  'aviatrix_distributed_firewalling_policy_list': {
    vendor: 'aviatrix',
    category: 'security',
    required: ['policies'],
    optional: []
  }
};

/**
 * Get resource category based on resource type
 */
export function getResourceCategory(resourceType) {
  const lowerType = resourceType.toLowerCase();

  for (const [category, config] of Object.entries(RESOURCE_CATEGORIES)) {
    if (category === 'other') continue;
    if (config.patterns.some(pattern => lowerType.includes(pattern))) {
      return category;
    }
  }

  return 'other';
}

/**
 * Get color for resource type
 */
export function getResourceColor(resourceType) {
  const category = getResourceCategory(resourceType);
  return RESOURCE_CATEGORIES[category].color;
}

/**
 * Get vendor from resource type
 */
export function getVendorFromResourceType(resourceType) {
  for (const [vendor, config] of Object.entries(ALLOWED_VENDORS)) {
    if (resourceType.startsWith(config.prefix)) {
      return vendor;
    }
  }
  return null;
}

/**
 * Validate if resource type is allowed (starts with allowed vendor prefix)
 */
export function isResourceTypeAllowed(resourceType) {
  return getVendorFromResourceType(resourceType) !== null;
}

/**
 * Get required attributes for a resource type
 */
export function getRequiredAttributes(resourceType) {
  const schema = RESOURCE_SCHEMAS[resourceType];
  return schema ? schema.required : [];
}

/**
 * Validate resource has required attributes
 */
export function validateResource(resourceType, resourceName, attributes) {
  const errors = [];
  const warnings = [];

  // Check if resource type is allowed
  if (!isResourceTypeAllowed(resourceType)) {
    errors.push(`Resource type "${resourceType}" is not from an allowed vendor. Allowed vendors: ${Object.keys(ALLOWED_VENDORS).join(', ')}`);
    return { valid: false, errors, warnings };
  }

  // Get required attributes
  const required = getRequiredAttributes(resourceType);
  const attributeKeys = Object.keys(attributes || {});

  // Check for required attributes
  required.forEach(attr => {
    if (!attributeKeys.includes(attr)) {
      errors.push(`Resource "${resourceType}.${resourceName}" is missing required attribute: "${attr}"`);
    }
  });

  // Check for common issues
  if (attributeKeys.length === 0) {
    warnings.push(`Resource "${resourceType}.${resourceName}" has no attributes defined`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Get schema for a resource type (or create default)
 */
export function getResourceSchema(resourceType) {
  if (RESOURCE_SCHEMAS[resourceType]) {
    return RESOURCE_SCHEMAS[resourceType];
  }

  // Create default schema for unknown resource types
  const vendor = getVendorFromResourceType(resourceType);
  if (!vendor) {
    return null;
  }

  return {
    vendor: vendor,
    category: getResourceCategory(resourceType),
    required: [],
    optional: []
  };
}
