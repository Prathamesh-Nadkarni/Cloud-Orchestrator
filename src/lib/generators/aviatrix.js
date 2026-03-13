export function generateAviatrix(nodes, edges = []) {
    let tf = `\n# --- Aviatrix Multi-Cloud Network --- \n`;
    let hasAviatrix = nodes.some(n => n.data.provider === 'aviatrix');

    if (!hasAviatrix) return '';

    tf += `provider "aviatrix" {\n  controller_ip = var.aviatrix_controller_ip\n  username      = var.aviatrix_username\n  password      = var.aviatrix_password\n}\n\n`;

    const avxNodes = nodes.filter(n => n.data.provider === 'aviatrix');

    // Auto-injection logic: if the user dropped Aviatrix resources, but missed Transit/Spoke, we construct a default hub-and-spoke.
    const hasTransit = avxNodes.some(n => n.data.type === 'transit');
    const hasSpoke = avxNodes.some(n => n.data.type === 'spoke');

    if (hasAviatrix && (!hasTransit || !hasSpoke)) {
        tf += `# [AUTO-INJECTED] Aviatrix Hub & Spoke Architecture\n`;
        if (!hasTransit) {
            tf += `resource "aviatrix_transit_gateway" "default_transit" {\n`;
            tf += `  cloud_type   = 1 # AWS\n`;
            tf += `  account_name = "aws-account"\n`;
            tf += `  gw_name      = "transit-gw-auto"\n`;
            tf += `  vpc_id       = "vpc-auto" # Placeholder\n`;
            tf += `  vpc_reg      = "us-east-1"\n`;
            tf += `  gw_size      = "t3.small"\n`;
            tf += `  subnet       = "10.0.0.0/24"\n`;
            tf += `  ha_gw_size   = "t3.small"\n}\n\n`;
        }
        if (!hasSpoke) {
            tf += `resource "aviatrix_spoke_gateway" "default_spoke" {\n`;
            tf += `  cloud_type   = 1 # AWS\n`;
            tf += `  account_name = "aws-account"\n`;
            tf += `  gw_name      = "spoke-gw-auto"\n`;
            tf += `  vpc_id       = "vpc-spoke-auto" # Placeholder\n`;
            tf += `  vpc_reg      = "us-east-1"\n`;
            tf += `  gw_size      = "t3.micro"\n`;
            tf += `  subnet       = "10.1.0.0/24"\n`;
            tf += `  transit_gw   = aviatrix_transit_gateway.default_transit.gw_name\n}\n\n`;
        }
    }

    // Generate explicit Aviatrix nodes placed on canvas
    avxNodes.forEach(node => {
        const { id, data } = node;
        const name = data.name || id.replace(/-/g, '_');

        if (data.type === 'transit') {
            tf += `resource "aviatrix_transit_gateway" "${name}" {\n`;
            tf += `  cloud_type   = 1 # Assume AWS for this demo if not mapped\n`;
            tf += `  account_name = "cloud-account"\n`;
            tf += `  gw_name      = "${name}-transit"\n`;
            tf += `  vpc_id       = "vpc-id"\n`;
            tf += `  vpc_reg      = "${data.region || 'us-east-1'}"\n`;
            tf += `  gw_size      = "${data.size || 't3.small'}"\n`;
            tf += `  subnet       = "10.0.0.0/28"\n`;
            if (data.bgpAsn) {
                tf += `  local_as_number = "${data.bgpAsn}"\n`;
            } else {
                tf += `  local_as_number = "${data.asn || 65000}"\n`;
            }
            if (data.requiresHA) {
                tf += `  ha_subnet    = "10.0.0.16/28"\n`;
                tf += `  ha_gw_size   = "${data.size || 't3.small'}"\n`;
            }
            tf += `}\n\n`;
        }
        else if (data.type === 'spoke') {
            tf += `resource "aviatrix_spoke_gateway" "${name}" {\n`;
            tf += `  cloud_type   = 1\n`;
            tf += `  account_name = "cloud-account"\n`;
            tf += `  gw_name      = "${name}-spoke"\n`;
            tf += `  vpc_id       = "vpc-id"\n`;
            tf += `  vpc_reg      = "${data.region || 'us-east-1'}"\n`;
            tf += `  gw_size      = "${data.size || 't3.micro'}"\n`;
            tf += `  subnet       = "10.1.0.0/28"\n`;
            tf += `  transit_gw   = "transit-gw-reference"\n`; // Ideally wired via edges
            if (data.bgpAsn) {
                tf += `  local_as_number = "${data.bgpAsn}"\n`;
            }
            if (data.requiresHA || data.ha) {
                tf += `  ha_gw_size   = "${data.size || 't3.micro'}"\n`;
                tf += `  ha_subnet    = "10.1.0.16/28"\n`;
            }
            tf += `}\n\n`;
        }
        else if (!['internet', 'client'].includes(data.type)) {
            tf += `resource "aviatrix_${data.type.toLowerCase().replace(/[^a-z0-9_]/g, '_')}_placeholder" "${name}" {\n`;
            tf += `  # TODO: Configuration for AI Workload / Custom resource (${data.label || data.type})\n`;
            tf += `  # Provide appropriate Aviatrix service configuration here.\n}\n\n`;
        }
    });

    return tf;
}
