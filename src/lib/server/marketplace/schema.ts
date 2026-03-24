import { z } from 'zod';

/**
 * Structural schema for a Vendor Integration Package Manifest (manifest.json).
 */
export const VendorManifestSchema = z.object({
    vendor: z.object({
        name: z.string(),
        slug: z.string(),
        description: z.string().optional(),
        website: z.string().url().optional(),
        supportEmail: z.string().email().optional(),
    }),
    product: z.object({
        name: z.string(),
        slug: z.string(),
        category: z.string(), // Networking, Security, Storage, etc.
        description: z.string().optional(),
        shortDescription: z.string().optional(),
        supportedProviders: z.array(z.string()), // ['aws', 'azure', 'gcp']
        supportedEnvironments: z.array(z.string()).optional(),
    }),
    package: z.object({
        version: z.string(),
        formatVersion: z.string().default('1.0.0'),
    }),
    compatibility: z.record(z.string(), z.any()).optional(),
});

export type VendorManifest = z.infer<typeof VendorManifestSchema>;

/**
 * Schema for topology component definitions (topology.json).
 */
export const TopologyComponentSchema = z.object({
    nodeType: z.string(),
    displayName: z.string(),
    iconRef: z.string().optional(),
    category: z.string().optional(),
    supportedConnections: z.array(z.string()).optional(),
    portDefinitions: z.record(z.string(), z.any()).optional(),
    defaultProperties: z.record(z.string(), z.any()).optional(),
    visualStyle: z.record(z.string(), z.any()).optional(),
});

export type TopologyComponent = z.infer<typeof TopologyComponentSchema>;
