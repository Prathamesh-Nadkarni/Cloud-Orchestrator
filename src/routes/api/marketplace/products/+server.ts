import { json } from '@sveltejs/kit';
import { MarketplaceCatalogService } from '$lib/server/marketplace/catalog';
import SECURITY_PRODUCT_CATALOG from '$lib/server/marketplace/security-catalog';

/**
 * GET /api/marketplace/products
 * List all available marketplace products.
 * Includes both database products and static security integration catalog.
 */
export async function GET({ url }: any) {
    const category = url.searchParams.get('category');
    const provider = url.searchParams.get('provider');
    const search = url.searchParams.get('search');

    try {
        // Get products from database
        let dbProducts = [];
        try {
            dbProducts = await MarketplaceCatalogService.listProducts({
                category: category || undefined,
                provider: provider || undefined,
                search: search || undefined
            });
        } catch (dbError) {
            console.warn('Database products unavailable, using static catalog only');
        }

        // Merge with static security catalog
        let allProducts = [...SECURITY_PRODUCT_CATALOG, ...dbProducts];

        // Apply filters to static catalog
        if (category && category !== 'All') {
            allProducts = allProducts.filter(p => p.category === category);
        }

        if (provider) {
            allProducts = allProducts.filter(p => 
                p.supportedProviders?.includes(provider)
            );
        }

        if (search) {
            const searchLower = search.toLowerCase();
            allProducts = allProducts.filter(p =>
                p.name.toLowerCase().includes(searchLower) ||
                p.shortDescription?.toLowerCase().includes(searchLower) ||
                p.vendor?.displayName?.toLowerCase().includes(searchLower) ||
                (p.tags && p.tags.some((tag: string) => tag.toLowerCase().includes(searchLower)))
            );
        }

        return json(allProducts);
    } catch (error: any) {
        return json({ error: error.message }, { status: 500 });
    }
}
