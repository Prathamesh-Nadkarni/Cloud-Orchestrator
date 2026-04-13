import { generateAWS } from './aws.js';
import { generateAzure } from './azure.js';
import { generateGCP } from './gcp.js';
import { generateAviatrix } from './aviatrix.js';
import { generateK8s } from './k8s.js';
import { generateDCF } from './dcf.js';

export function parseCanvas(nodes, edges, importedDCF) {
    const hasCloudNodes = nodes.some(n =>
        ['aws', 'azure', 'gcp', 'aviatrix'].includes(n.data.provider) ||
        ['vpc', 'vnet', 'compute', 'storage', 'kubernetes'].includes(n.data.type)
    );

    const hasK8sNodes = nodes.some(n =>
        ['k8sPod', 'k8sService', 'k8sNode'].includes(n.data.type) ||
        n.data.provider === 'kubernetes'
    );

    let terraformVars = "";
    if (hasCloudNodes) {
        terraformVars = `# --- Variables ---\n`;
        terraformVars += `# Set via TF_VAR_aviatrix_controller_ip env var or a .tfvars file (do not hardcode).\n`;
        terraformVars += `variable "aviatrix_controller_ip" {}\n`;
        terraformVars += `variable "aviatrix_username" {}\n`;
        terraformVars += `# Never commit a default password. Supply via TF_VAR_aviatrix_password or Vault.\n`;
        terraformVars += `variable "aviatrix_password" { sensitive = true }\n\n`;
    }

    const awsCode = generateAWS(nodes, edges);
    const azureCode = generateAzure(nodes, edges);
    const gcpCode = generateGCP(nodes, edges);
    const avxCode = generateAviatrix(nodes, edges);
    const k8sCode = generateK8s(nodes, edges);
    const dcfCode = importedDCF ? generateDCF(importedDCF) : "";

    let finalCode = terraformVars;
    if (awsCode) finalCode += awsCode;
    if (azureCode) finalCode += azureCode;
    if (gcpCode) finalCode += gcpCode;
    if (avxCode) finalCode += avxCode;
    if (dcfCode) finalCode += dcfCode;

    if (nodes.length === 0) {
        finalCode = "# Canvas is empty. Drag and drop resources to generate code.";
    } else if (!hasCloudNodes && hasK8sNodes) {
        finalCode = ""; // No terraform if only k8s
    }

    return {
        terraform: finalCode,
        kubernetes: k8sCode,
        hasK8sOnly: !hasCloudNodes && hasK8sNodes
    };
}
