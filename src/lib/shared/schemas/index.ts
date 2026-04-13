import { z } from 'zod';

export const CloudConnectionSchema = z.object({
    id: z.string().uuid().optional(),
    tenantId: z.string().uuid(),
    provider: z.enum(['AWS', 'AZURE', 'GCP']),
    displayName: z.string().min(1).max(255),
    connectionMode: z.enum(['DELEGATED_IDENTITY', 'SEALED_SECRET']),
    bootstrapMode: z.enum(['MANUAL', 'OIDC', 'BOOTSTRAP_INSTALLER']),
    allowedActionScopes: z.array(z.string()),
    allowedRegions: z.array(z.string()),
    allowedEnvironments: z.array(z.string()),
});

export type CloudConnectionDTO = z.infer<typeof CloudConnectionSchema>;

export const ThreatRuleSchema = z.object({
    id: z.string().uuid().optional(),
    tenantId: z.string().uuid(),
    name: z.string().min(1),
    description: z.string().optional(),
    category: z.string(),
    enabled: z.boolean().default(true),
    detectionType: z.string(),
    environmentScope: z.array(z.string()),
    assetScope: z.array(z.string()),
    protocolScope: z.array(z.string()),
    thresholdConfig: z.record(z.string(), z.any()).optional(),
    severityDefault: z.string(),
    severityOverride: z.string().optional(),
    auditRef: z.string().optional()
});

export const AwsIntakeSchema = z.object({
    roleArn: z.string().startsWith('arn:aws:iam::'),
    externalId: z.string().optional(),
    region: z.string().default('us-east-1')
});

export const AzureIntakeSchema = z.object({
    tenantId: z.string().uuid(),
    clientId: z.string().uuid(),
    clientSecret: z.string(),
    subscriptionId: z.string().uuid()
});

export const GcpIntakeSchema = z.object({
    projectId: z.string(),
    serviceAccountKey: z.record(z.any()) // JSON key file
});

export type ThreatRuleDTO = z.infer<typeof ThreatRuleSchema>;

export const FindingSchema = z.object({
    id: z.string().uuid().optional(),
    tenantId: z.string().uuid(),
    sourceEngine: z.string(),
    findingType: z.string(),
    provider: z.string(),
    assetRefs: z.array(z.string()),
    pathRefs: z.array(z.string()),
    severity: z.string(),
    confidence: z.number().min(0).max(1),
    status: z.enum(['OPEN', 'RESOLVED', 'IGNORED']).default('OPEN'),
});

export type FindingDTO = z.infer<typeof FindingSchema>;
