import { generateAWS } from './aws.js';
import { generateAzure } from './azure.js';
import { generateGCP } from './gcp.js';
import { generateAviatrix } from './aviatrix.js';
import { generateK8s } from './k8s.js';

export function parseCanvas(nodes, edges) {
    let terraformVars = `# --- Variables (Example) ---\n`;
    terraformVars += `variable "aviatrix_controller_ip" { default = "x.x.x.x" }\n`;
    terraformVars += `variable "aviatrix_username" { default = "admin" }\n`;
    terraformVars += `variable "aviatrix_password" { default = "password" }\n\n`;

    const awsNodes = nodes.filter(n => n.data.provider === 'aws');
    const azureNodes = nodes.filter(n => n.data.provider === 'azure');
    const gcpNodes = nodes.filter(n => n.data.provider === 'gcp');

    const awsCode = generateAWS(awsNodes, edges);
    const azureCode = generateAzure(azureNodes, edges);
    const gcpCode = generateGCP(gcpNodes, edges);
    const avxCode = generateAviatrix(nodes, edges); // Pass all nodes as Aviatrix might oversee multicloud
    const k8sCode = generateK8s(nodes, edges);

    let finalCode = terraformVars;
    if (awsCode) finalCode += awsCode;
    if (azureCode) finalCode += azureCode;
    if (gcpCode) finalCode += gcpCode;
    if (avxCode) finalCode += avxCode;

    if (nodes.length === 0) {
        finalCode = "# Canvas is empty. Drag and drop resources to generate Terraform code.";
    }

    return {
        terraform: finalCode,
        kubernetes: k8sCode
    };
}
