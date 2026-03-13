export interface NetworkCapability {
    maxSupportedBandwidthMbps: number;
    networkTier: 'standard' | 'premium' | 'accelerated';
}

export interface CSPNetworkProfile {
    provider: 'aws' | 'azure' | 'gcp' | 'kubernetes';
    instances: Record<string, NetworkCapability>;
    gateways: Record<string, NetworkCapability>;
    loadBalancers: Record<string, NetworkCapability>;
}

export const AWSNetworkProfile: CSPNetworkProfile = {
    provider: 'aws',
    instances: {
        't3.micro': { maxSupportedBandwidthMbps: 5000, networkTier: 'standard' },
        'm5.large': { maxSupportedBandwidthMbps: 10000, networkTier: 'standard' },
        'c5n.xlarge': { maxSupportedBandwidthMbps: 25000, networkTier: 'accelerated' },
        'p4d.24xlarge': { maxSupportedBandwidthMbps: 400000, networkTier: 'accelerated' },
    },
    gateways: {
        'nat-gateway': { maxSupportedBandwidthMbps: 45000, networkTier: 'standard' },
        'transit-gateway': { maxSupportedBandwidthMbps: 50000, networkTier: 'premium' },
        'internet-gateway': { maxSupportedBandwidthMbps: 100000, networkTier: 'standard' },
    },
    loadBalancers: {
        'alb': { maxSupportedBandwidthMbps: 50000, networkTier: 'premium' },
        'nlb': { maxSupportedBandwidthMbps: 100000, networkTier: 'accelerated' },
    }
};

export const AzureNetworkProfile: CSPNetworkProfile = {
    provider: 'azure',
    instances: {
        'Standard_B1s': { maxSupportedBandwidthMbps: 1000, networkTier: 'standard' },
        'Standard_D4s_v3': { maxSupportedBandwidthMbps: 8000, networkTier: 'standard' },
        'Standard_ND96asr_v4': { maxSupportedBandwidthMbps: 200000, networkTier: 'accelerated' },
    },
    gateways: {
        'vpngw1': { maxSupportedBandwidthMbps: 650, networkTier: 'standard' },
        'ergw3': { maxSupportedBandwidthMbps: 10000, networkTier: 'premium' },
        'nat-gateway': { maxSupportedBandwidthMbps: 50000, networkTier: 'standard' },
    },
    loadBalancers: {
        'standard-lb': { maxSupportedBandwidthMbps: 50000, networkTier: 'premium' },
        'app-gateway': { maxSupportedBandwidthMbps: 40000, networkTier: 'premium' },
    }
};

export const GCPNetworkProfile: CSPNetworkProfile = {
    provider: 'gcp',
    instances: {
        'e2-micro': { maxSupportedBandwidthMbps: 1000, networkTier: 'standard' },
        'n1-standard-4': { maxSupportedBandwidthMbps: 10000, networkTier: 'standard' },
        'a2-megagpu-16g': { maxSupportedBandwidthMbps: 100000, networkTier: 'accelerated' },
    },
    gateways: {
        'cloud-nat': { maxSupportedBandwidthMbps: 32000, networkTier: 'standard' },
        'cloud-vpn': { maxSupportedBandwidthMbps: 3000, networkTier: 'standard' },
        'cloud-router': { maxSupportedBandwidthMbps: 50000, networkTier: 'premium' },
    },
    loadBalancers: {
        'global-http': { maxSupportedBandwidthMbps: 100000, networkTier: 'premium' },
        'tcp-proxy': { maxSupportedBandwidthMbps: 100000, networkTier: 'premium' },
    }
};

export const NetworkProfiles: Record<string, CSPNetworkProfile> = {
    aws: AWSNetworkProfile,
    azure: AzureNetworkProfile,
    gcp: GCPNetworkProfile
};
