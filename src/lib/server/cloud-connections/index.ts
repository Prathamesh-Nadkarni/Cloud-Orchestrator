// Cloud Connection Service
// Manages the state machine and metadata for cloud connections, deferring 
// actual secret encryption to the SecretBroker.

import { prisma } from '../db';
import { SecretBroker } from '../secret-plane';
import { AuditLogger } from '../audit';
import type { CloudConnectionDTO } from '../../shared/schemas';

export class CloudConnectionService {
    /**
     * Intakes a new cloud credential.
     * Immediately seals the credential so the plaintext is never stored.
     */
    static async createConnection(
        tenantId: string,
        actorId: string,
        dto: CloudConnectionDTO,
        plaintextSecret: string
    ): Promise<string> {

        // 1. Envelope encryption via the Secret Broker
        const material = await SecretBroker.sealSecret(tenantId, plaintextSecret);

        // 2. Only metadata and ciphertext refs are committed to the DB
        const connection = await prisma.cloudConnection.create({
            data: {
                tenantId,
                provider: dto.provider,
                displayName: dto.displayName,
                connectionMode: dto.connectionMode,
                bootstrapMode: dto.bootstrapMode,
                ciphertextRef: material.ciphertextBlobRef,
                allowedActionScopes: dto.allowedActionScopes,
                allowedEnvironments: dto.allowedEnvironments,
                allowedRegions: dto.allowedRegions,
                state: 'SEALED',
            }
        });

        await AuditLogger.log({
            tenantId,
            actorId,
            action: 'CLOUD_CONNECTION_CREATED',
            targetRef: connection.id,
            status: 'SUCCESS',
            metadata: { provider: dto.provider, mode: dto.connectionMode }
        });

        return connection.id;
    }

    /**
     * Used when a connection is un-usable but waiting for user to bind credentials
     */
    static async createPendingConnection(tenantId: string, dto: CloudConnectionDTO): Promise<string> {
        const connection = await prisma.cloudConnection.create({
            data: {
                tenantId,
                provider: dto.provider,
                displayName: dto.displayName,
                connectionMode: dto.connectionMode,
                bootstrapMode: dto.bootstrapMode,
                allowedActionScopes: dto.allowedActionScopes,
                allowedEnvironments: dto.allowedEnvironments,
                allowedRegions: dto.allowedRegions,
                state: 'UNBOUND',
            }
        });
        return connection.id;
    }
}
