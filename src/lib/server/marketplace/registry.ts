import { prisma } from '$lib/server/db';
import { VendorManifestSchema, type VendorManifest } from './schema';

export class VendorRegistryService {
    /**
     * Submit a new vendor package for review.
     */
    static async submitPackage(vendorId: string, manifest: VendorManifest, packageData: any) {
        // 1. Validate Manifest
        const validatedManifest = VendorManifestSchema.parse(manifest);

        return prisma.$transaction(async (tx: any) => {
            // Find or create product
            let product = await tx.vendorProduct.findUnique({
                where: { slug: validatedManifest.product.slug }
            });

            if (!product) {
                product = await tx.vendorProduct.create({
                    data: {
                        vendorId,
                        name: validatedManifest.product.name,
                        slug: validatedManifest.product.slug,
                        category: validatedManifest.product.category,
                        description: validatedManifest.product.description,
                        shortDescription: validatedManifest.product.shortDescription,
                        supportedProviders: validatedManifest.product.supportedProviders,
                        supportedEnvironments: validatedManifest.product.supportedEnvironments || [],
                        marketplaceStatus: 'DRAFT',
                    }
                });
            }

            // Create Package record
            const pkg = await tx.vendorPackage.create({
                data: {
                    vendorId,
                    productId: product.id,
                    version: validatedManifest.package.version,
                    packageFormatVersion: validatedManifest.package.formatVersion,
                    reviewStatus: 'SUBMITTED',
                    publishStatus: 'UNPUBLISHED',
                    compatibilityMatrix: validatedManifest.compatibility || {},
                }
            });

            // Create Submission record
            await tx.vendorSubmission.create({
                data: {
                    vendorId,
                    packageId: pkg.id,
                    submissionType: 'UPLOAD',
                    status: 'PENDING',
                }
            });

            return pkg;
        });
    }

    /**
     * Approve a package submission.
     */
    static async approveSubmission(submissionId: string, reviewerId: string, notes?: string) {
        const { MarketplaceSignatureService } = await import('./signature');

        return prisma.$transaction(async (tx: any) => {
            const submission = await tx.vendorSubmission.update({
                where: { id: submissionId },
                data: {
                    status: 'APPROVED',
                    decidedAt: new Date(),
                    notes
                },
                include: {
                    vendor: true,
                    package: {
                        include: {
                            product: true
                        }
                    }
                }
            });

            // Generate Integrity Signature
            const signature = MarketplaceSignatureService.signPackage(
                submission.package.product.slug,
                submission.package.version,
                { /* Manifest data would go here in prod */ }
            );

            await tx.packageReview.create({
                data: {
                    submissionId,
                    reviewerId,
                    status: 'APPROVED',
                    notes
                }
            });

            // Update package status and store signature
            await tx.vendorPackage.update({
                where: { id: submission.packageId },
                data: {
                    reviewStatus: 'APPROVED',
                    signature: signature
                }
            });

            return submission;
        });
    }

    /**
     * Reject a package submission.
     */
    static async rejectSubmission(submissionId: string, reviewerId: string, notes: string) {
        return prisma.$transaction(async (tx: any) => {
            const submission = await tx.vendorSubmission.update({
                where: { id: submissionId },
                data: {
                    status: 'REJECTED',
                    decidedAt: new Date(),
                    notes
                }
            });

            await tx.packageReview.create({
                data: {
                    submissionId,
                    reviewerId,
                    status: 'REJECTED',
                    notes
                }
            });

            await tx.vendorPackage.update({
                where: { id: submission.packageId },
                data: { reviewStatus: 'REJECTED' }
            });

            return submission;
        });
    }

    /**
     * Fetch pending submissions for the admin UI.
     */
    static async getPendingSubmissions() {
        return prisma.vendorSubmission.findMany({
            where: { status: 'PENDING' },
            include: {
                vendor: true,
                package: {
                    include: {
                        product: true
                    }
                }
            },
            orderBy: { submittedAt: 'desc' }
        });
    }

    /**
     * Publish an approved package.
     */
    static async publishPackage(packageId: string) {
        return prisma.vendorPackage.update({
            where: { id: packageId },
            data: { publishStatus: 'PUBLISHED' }
        });
    }

    /**
     * Internal: Seed a system vendor (e.g., official HashiCorp modules).
     */
    static async seedSystemVendor(name: string, slug: string) {
        return prisma.vendor.upsert({
            where: { slug },
            update: { displayName: name },
            create: {
                displayName: name,
                slug,
                verificationStatus: 'VERIFIED',
                status: 'ACTIVE'
            }
        });
    }
}
