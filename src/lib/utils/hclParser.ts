import hclParser from 'js-hcl-parser';
const hcl = (hclParser as any).parse ? hclParser : (hclParser as any).default || hclParser;

export interface ParsedDiagram {
    nodes: any[];
    edges: any[];
}

export function parseHclToDiagram(content: string): ParsedDiagram {
    const nodes: any[] = [];
    const edges: any[] = [];
    let xPos = 100;
    let yPos = 100;

    try {
        const parsed = hcl.parse(content);
        const resources = parsed.resource || {};

        Object.entries(resources).forEach(([resourceType, resourceMap]: [string, any]) => {
            Object.entries(resourceMap).forEach(([resourceName, body]: [string, any]) => {
                let nodeType = "compute";
                let provider = "aws";

                if (resourceType.startsWith("aws_")) provider = "aws";
                else if (resourceType.startsWith("azurerm_")) provider = "azure";
                else if (resourceType.startsWith("google_")) provider = "gcp";

                if (resourceType.includes("vpc") || resourceType.includes("virtual_network")) nodeType = "vpc";
                else if (resourceType.includes("subnet")) nodeType = "subnet";
                else if (resourceType.includes("instance") || resourceType.includes("vm")) nodeType = "compute";
                else if (resourceType.includes("db") || resourceType.includes("sql") || resourceType.includes("rds")) nodeType = "database";
                else if (resourceType.includes("security_group") || resourceType.includes("firewall")) nodeType = "securityGroup";
                else if (resourceType.includes("kubernetes") || resourceType.includes("eks") || resourceType.includes("aks") || resourceType.includes("gke")) nodeType = "kubernetes";
                else if (resourceType.includes("storage") || resourceType.includes("s3") || resourceType.includes("blob")) nodeType = "storage";
                else if (resourceType.includes("load_balancer") || resourceType.includes("lb")) nodeType = "loadBalancer";

                if (provider === "azure" && nodeType === "vpc") nodeType = "vnet";

                const nodeData: any = {
                    type: nodeType,
                    label: resourceName,
                    provider,
                    name: resourceName,
                };

                // Extraction from HCL body
                if (body.cidr_block) nodeData.cidr = body.cidr_block;
                if (body.address_space) nodeData.cidr = body.address_space[0];
                if (body.instance_type) nodeData.size = body.instance_type;
                if (body.vm_size) nodeData.size = body.vm_size;

                nodes.push({
                    id: `tf-${resourceName}-${Date.now()}-${nodes.length}`,
                    type: "cloud",
                    position: { x: xPos, y: yPos },
                    data: nodeData,
                });

                xPos += 250;
                if (xPos > 900) {
                    xPos = 100;
                    yPos += 200;
                }
            });
        });
    } catch (err) {
        console.error("HCL Parse Error:", err);
        // Fallback to regex or partial parse if needed, but for now we'll throw
        throw new Error("Failed to parse Terraform HCL");
    }

    return { nodes, edges };
}
