// Server-side Cloud Provider Interfaces
// Standardizes abstraction across AWS, Azure, GCP so Execution plane logic is agnostic

export interface ActionScope {
    service: string;   // e.g. 'ec2', 'iam'
    action: string;    // e.g. 'CreateVpc', 'DescribeInstances'
    resources: string[];
}

export interface ProviderValidationResult {
    valid: boolean;
    metadata?: {
        accountId?: string;
        alias?: string;
        roles?: string[];
    };
    error?: string;
}

export interface DiscoveryResult {
    assets: any[];
    rawMetadata: Record<string, any>;
}

export interface ProviderCredential {
    id: string;
    type: string;
    material: any;
    expiresAt?: Date;
}

export interface CloudProviderAdapter {
    provider: string;

    validateCredentials(creds: ProviderCredential): Promise<boolean>;
    discoverResources(connectionId: string): Promise<DiscoveryResult>;

    /**
     * Validates a provided bootstrap credential (e.g. initial IAM static key/STS token)
     */
    validateBootstrapCredential(credentials: any): Promise<ProviderValidationResult>;

    /**
     * Performs the initial bootstrap: creates delegated least-privilege identities, 
     * trust relationship, returns the new Identity references to seal.
     */
    executeBootstrapInstaller(credentials: any, requestedScopes: ActionScope[]): Promise<any>;

    /**
     * Assume an execution role given the sealed Delegated Identity refs and an active auth grant.
     * Returns temporal, scoped execution credentials to the worker.
     */
    assumeExecutionRole(identityRefs: any, sessionName: string): Promise<any>;
}
