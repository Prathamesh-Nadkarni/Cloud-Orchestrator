import { prisma } from '$lib/server/db';
// import type { Prisma } from '@prisma/client';
import { TerraformArtifactService } from '../terraform/artifact';
import crypto from 'crypto';
import { AuditLogger } from '../audit';

export class DiagramService {
    /**
     * Create a new infrastructure diagram.
     */
    static async createDiagram(data: {
        tenantId: string;
        ownerId: string;
        name: string;
        description?: string;
        providers: string[];
        topologySnapshot: any;
        resourceConfig: any;
    }) {
        return prisma.infrastructureDiagram.create({
            data: {
                tenantId: data.tenantId,
                ownerId: data.ownerId,
                name: data.name,
                description: data.description,
                providers: data.providers,
                topologySnapshot: data.topologySnapshot,
                resourceConfig: data.resourceConfig,
                status: 'DRAFT'
            }
        });
    }

    /**
     * List diagrams for a specific tenant.
     */
    static async listDiagrams(tenantId: string) {
        return prisma.infrastructureDiagram.findMany({
            where: { tenantId },
            orderBy: { updatedAt: 'desc' },
            include: {
                owner: {
                    select: { name: true, email: true }
                }
            }
        });
    }

    /**
     * Get a diagram by ID with its current version.
     */
    static async getDiagram(diagramId: string) {
        return prisma.infrastructureDiagram.findUnique({
            where: { id: diagramId },
            include: {
                versions: {
                    orderBy: { versionNumber: 'desc' },
                    take: 1
                }
            }
        });
    }

    /**
     * Save a new version of the diagram/artifact.
     */
    static async saveVersion(diagramId: string, userId: string, data: {
        topologySnapshot: any;
        resourceConfig: any;
        changeSummary?: string;
        sourceMode?: 'DIAGRAM' | 'TERRAFORM';
        manualTerraform?: string;
        manualK8s?: string;
    }) {
        const { topologySnapshot, resourceConfig, changeSummary, sourceMode = 'DIAGRAM', manualTerraform, manualK8s } = data;
        const nodes = topologySnapshot.nodes || [];
        const edges = topologySnapshot.edges || [];

        return prisma.$transaction(async (tx: any) => {
            // Get current version count
            const count = await tx.diagramVersion.count({
                where: { diagramId }
            });

            const nextVersion = count + 1;

            // Create new version record
            const version = await tx.diagramVersion.create({
                data: {
                    diagramId,
                    versionNumber: nextVersion,
                    diagramSnapshot: topologySnapshot,
                    changeSummary: changeSummary || (sourceMode === 'TERRAFORM' ? 'Manual Terraform Edit' : 'Diagram Update'),
                    createdBy: userId,
                    sourceMode: sourceMode
                }
            });

            // If manual override, skip generation and use provided content
            if (sourceMode === 'TERRAFORM') {
                const artifact = await tx.terraformArtifact.create({
                    data: {
                        diagramId,
                        diagramVersionId: version.id,
                        fileManifest: [
                            { path: 'main.tf', type: 'hcl' },
                            { path: 'kubernetes.yaml', type: 'yaml' }
                        ],
                        generationMode: 'MANUAL',
                        validationStatus: 'UNVALIDATED'
                    }
                });

                if (manualTerraform) {
                    await tx.terraformFile.create({
                        data: {
                            artifactId: artifact.id,
                            path: 'main.tf',
                            filename: 'main.tf',
                            type: 'hcl',
                            content: manualTerraform,
                            hash: crypto.createHash('md5').update(manualTerraform).digest('hex')
                        }
                    });
                }

                if (manualK8s) {
                    await tx.terraformFile.create({
                        data: {
                            artifactId: artifact.id,
                            path: 'kubernetes.yaml',
                            filename: 'kubernetes.yaml',
                            type: 'yaml',
                            content: manualK8s,
                            hash: crypto.createHash('md5').update(manualK8s).digest('hex')
                        }
                    });
                }

                // Link artifact to version
                await tx.diagramVersion.update({
                    where: { id: version.id },
                    data: { terraformArtifactId: artifact.id }
                });
            } else {
                // Standard Diagram-driven generation
                await TerraformArtifactService.generateForVersion(
                    diagramId,
                    version.id,
                    nodes,
                    edges
                );
            }

            await tx.infrastructureDiagram.update({
                where: { id: diagramId },
                data: {
                    topologySnapshot: topologySnapshot,
                    resourceConfig: resourceConfig,
                    currentVersionId: version.id,
                    updatedAt: new Date(),
                    syncState: sourceMode === 'TERRAFORM' ? 'DIVERGED' : 'SYNCED'
                }
            });

            // Log Audit Event
            await AuditLogger.log({
                actorId: userId,
                action: sourceMode === 'TERRAFORM' ? 'TERRAFORM_MANUALLY_EDITED' : 'DIAGRAM_VERSION_SAVED',
                targetRef: diagramId,
                status: 'SUCCESS',
                metadata: {
                    versionNumber: nextVersion,
                    sourceMode
                }
            });

            return version;
        });
    }

    /**
     * Delete/Archive a diagram.
     */
    static async archiveDiagram(diagramId: string) {
        return prisma.infrastructureDiagram.update({
            where: { id: diagramId },
            data: { status: 'ARCHIVED' }
        });
    }
}
