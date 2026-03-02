import { generateAWS } from './aws.js';
import { generateAzure } from './azure.js';
import { generateGCP } from './gcp.js';
import { generateAviatrix } from './aviatrix.js';
import { generateK8s } from './k8s.js';

export function parseCanvas(nodes, edges) {
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
        terraformVars = `# --- Variables (Example) ---\n`;
        terraformVars += `variable "aviatrix_controller_ip" { default = "x.x.x.x" }\n`;
        terraformVars += `variable "aviatrix_username" { default = "admin" }\n`;
        terraformVars += `variable "aviatrix_password" { default = "password" }\n\n`;
    }

    const awsCode = generateAWS(nodes, edges);
    const azureCode = generateAzure(nodes, edges);
    const gcpCode = generateGCP(nodes, edges);
    const avxCode = generateAviatrix(nodes, edges);
    const k8sCode = generateK8s(nodes, edges);

    let finalCode = terraformVars;
    if (awsCode) finalCode += awsCode;
    if (azureCode) finalCode += azureCode;
    if (gcpCode) finalCode += gcpCode;
    if (avxCode) finalCode += avxCode;

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
