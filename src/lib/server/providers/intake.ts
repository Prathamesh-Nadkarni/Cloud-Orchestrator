// Provider Intake Service
// Orchestrates the ingestion of cloud credentials, their validation via adapters,
// and their sealing into the vault.

import { CloudConnectionService } from '../cloud-connections';
import { AwsProviderAdapter } from '../providers/aws';
import { AzureProviderAdapter } from '../providers/azure';
import { GcpProviderAdapter } from '../providers/gcp';
import type { CloudProviderAdapter } from '../providers/interfaces';
import { AuditLogger } from '../audit';

export class ProviderIntakeService {
    private static adapters: Record<string, CloudProviderAdapter> = {
        'AWS': new AwsProviderAdapter(),
        'AZURE': new AzureProviderAdapter(),
        'GCP': new GcpProviderAdapter()
    };

    /**
     * High-level intake flow: Validate -> Seal -> Register
     */
    static async intake(params: {
        tenantId: string;
        userId: string;
        provider: 'AWS' | 'AZURE' | 'GCP';
        displayName: string;
        credentialMaterial: any; // Raw material before sealing
    }): Promise<string> {

        const adapter = this.adapters[params.provider];
        if (!adapter) throw new Error(`Unsupported provider: ${params.provider}`);

        // 1. Initial Validation
        const isValid = await adapter.validateBootstrapCredential(params.credentialMaterial);
        if (!isValid) throw new Error('Invalid cloud credentials provided.');

        // 2. Create the connection (Initial state: UNBOUND/SEALING)
        const connectionId = await CloudConnectionService.createConnection({
            tenantId: params.tenantId,
            provider: params.provider,
            displayName: params.displayName,
            connectionMode: 'SEALED_SECRET',
            bootstrapMode: 'MANUAL'
        });

        // 3. Initiate Sealing (Scaffold: mock sealing process)
        // In prod: Hand material to Vault/KMS and store only the ciphertextRef
        console.log(`Sealing credentials for ${params.provider} connection ${connectionId}`);

        await AuditLogger.log({
            tenantId: params.tenantId,
            actorId: params.userId,
            action: 'CLOUD_CONNECTION_CREATED',
            targetRef: connectionId,
            status: 'SUCCESS',
            metadata: { provider: params.provider }
        });

        return connectionId;
    }
}
