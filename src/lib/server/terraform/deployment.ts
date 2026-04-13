import { prisma } from '$lib/server/db';
import { AuditLogger } from '../audit';
// import type { RunStatus } from '@prisma/client';

export class DeploymentService {
    /**
     * Start a new deployment run (Plan, Apply, or Destroy).
     */
    static async startRun(diagramId: string, versionId: string, userId: string, type: 'PLAN' | 'APPLY' | 'DESTROY') {
        const run = await prisma.deploymentRun.create({
            data: {
                diagramId,
                diagramVersionId: versionId,
                type,
                status: 'QUEUED',
                createdBy: userId,
                logs: 'Job queued...'
            }
        });

        // Log Audit Event
        await AuditLogger.log({
            actorId: userId,
            action: 'DEPLOYMENT_STARTED',
            targetRef: run.id,
            status: 'SUCCESS',
            metadata: { diagramId, versionId, type }
        });

        // In a real system, this would trigger an async worker or message queue
        this.executeRun(run.id, userId);

        return run;
    }

    /**
     * Simulate/Execute the run and update logs.
     */
    private static async executeRun(runId: string, userId: string) {
        await prisma.deploymentRun.update({
            where: { id: runId },
            data: {
                status: 'RUNNING',
                startedAt: new Date(),
                logs: 'Initializing Terraform execution...\n'
            }
        });

        // Simulation delay
        setTimeout(async () => {
            try {
                // Fetch the files for the version
                const run = await prisma.deploymentRun.findUnique({
                    where: { id: runId },
                    include: { diagramVersion: { include: { terraformArtifact: { include: { files: true } } } } }
                });

                if (!run) return;

                const files = run.diagramVersion.terraformArtifact?.files || [];
                let logOutput = run.logs + `Found ${files.length} artifacts. Preparing workspace...\n`;

                // Simulate Plan output if type is PLAN
                if (run.type === 'PLAN') {
                    logOutput += `Terraform will perform the following actions:\n`;
                    files.forEach(f => {
                        logOutput += `  + resource ${f.filename} created\n`;
                    });
                    logOutput += `\nPlan: ${files.length} to add, 0 to change, 0 to destroy.\n`;
                } else if (run.type === 'APPLY') {
                    logOutput += `Applying changes...\n`;
                    files.forEach(f => {
                        logOutput += `Creating ${f.filename}...\n`;
                    });
                    logOutput += `\nApply complete! Resources: ${files.length} added, 0 changed, 0 destroyed.\n`;
                }

                await prisma.deploymentRun.update({
                    where: { id: runId },
                    data: {
                        status: 'COMPLETED',
                        completedAt: new Date(),
                        logs: logOutput
                    }
                });

            } catch (err: any) {
                await prisma.deploymentRun.update({
                    where: { id: runId },
                    data: {
                        status: 'FAILED',
                        completedAt: new Date(),
                        logs: `Execution failed: ${err.message}`
                    }
                });
            }
        }, 3000);
    }

    /**
     * Get run history for a diagram.
     */
    static async getRunHistory(diagramId: string) {
        return prisma.deploymentRun.findMany({
            where: { diagramId },
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { name: true, email: true } } }
        });
    }

    /**
     * Get a single run with logs.
     */
    static async getRun(runId: string) {
        return prisma.deploymentRun.findUnique({
            where: { id: runId },
            include: { user: { select: { name: true } } }
        });
    }
}
