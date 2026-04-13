import { prisma } from '$lib/server/db';

export interface ResolvedVendorModule {
    source: string;
    version: string;
    inputs: Record<string, any>;
    outputs: string[];
}

export class VendorTerraformResolver {
    /**
     * Resolve a vendor product to its corresponding Terraform module configuration.
     */
    static async resolveModule(productId: string, nodeData: any): Promise<ResolvedVendorModule | null> {
        // 1. Fetch the latest published package for the product
        const pkg = await prisma.vendorPackage.findFirst({
            where: {
                productId,
                publishStatus: 'PUBLISHED'
            },
            include: {
                terraformModules: true
            },
            orderBy: {
                version: 'desc'
            }
        });

        if (!pkg || pkg.terraformModules.length === 0) {
            return null;
        }

        // 2. Currently picking the first module contribution
        const moduleDef = pkg.terraformModules[0];

        // 3. Map node properties to module inputs based on the mapping definition
        const inputs: Record<string, any> = {};
        const mapping = moduleDef.inputMapping as Record<string, string>;

        if (mapping) {
            for (const [moduleVar, nodeKey] of Object.entries(mapping)) {
                if (nodeData[nodeKey] !== undefined) {
                    inputs[moduleVar] = nodeData[nodeKey];
                }
            }
        }

        return {
            source: moduleDef.moduleSource,
            version: moduleDef.moduleVersion || pkg.version,
            inputs,
            outputs: (moduleDef.outputExposed as string[]) || []
        };
    }
}
