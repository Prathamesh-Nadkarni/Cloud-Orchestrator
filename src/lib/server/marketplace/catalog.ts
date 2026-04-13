import { prisma } from '$lib/server/db';

export class MarketplaceCatalogService {
    /**
     * List all published products with optional filtering.
     */
    static async listProducts(filters: { category?: string, provider?: string, search?: string } = {}) {
        const where: any = {
            marketplaceStatus: 'PUBLISHED'
        };

        if (filters.category) {
            where.category = filters.category;
        }

        if (filters.provider) {
            where.supportedProviders = {
                has: filters.provider
            };
        }

        if (filters.search) {
            where.OR = [
                { name: { contains: filters.search, mode: 'insensitive' } },
                { description: { contains: filters.search, mode: 'insensitive' } },
                { vendor: { displayName: { contains: filters.search, mode: 'insensitive' } } }
            ];
        }

        return prisma.vendorProduct.findMany({
            where,
            include: {
                vendor: true,
                pricingMetadata: true,
                packages: {
                    where: { publishStatus: 'PUBLISHED' },
                    orderBy: { version: 'desc' },
                    take: 1
                }
            }
        });
    }

    /**
     * Get detailed information for a single product.
     */
    static async getProductDetails(slug: string) {
        return prisma.vendorProduct.findUnique({
            where: { slug },
            include: {
                vendor: true,
                pricingMetadata: true,
                packages: {
                    where: { publishStatus: 'PUBLISHED' },
                    orderBy: { version: 'desc' },
                    include: {
                        topologyComponents: true,
                        securityModels: true,
                        terraformModules: true
                    }
                }
            }
        });
    }

    /**
     * Get unique categories for filtering.
     */
    static async getCategories() {
        const results = await prisma.vendorProduct.groupBy({
            by: ['category'],
            where: { marketplaceStatus: 'PUBLISHED' }
        });
        return results.map((r: { category: string }) => r.category);
    }
}
