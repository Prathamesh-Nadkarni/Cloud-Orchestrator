export function generateGCP(nodes, edges = []) {
    let tf = `\n# --- GCP Resources ---\n`;
    const gcpNodes = nodes.filter(n => n.data.provider === 'gcp' || (n.data.provider === 'kubernetes' && nodes.find(p => p.id === n.parentId)?.data.provider === 'gcp'));
    let hasGCP = false;

    const getRegion = (n) => n.data.region || 'us-central1';

    // Helper to find connected node of a specific type (checks parent hierarchy first, then edges)
    const resolveDependency = (nodeId, targetType) => {
        let currentId = nodeId;
        while (currentId) {
            const node = nodes.find(n => n.id === currentId);
            if (!node) break;
            if (node.id !== nodeId && node.data.type === targetType) {
                return node.data.name || node.id.replace(/-/g, '_');
            }
            currentId = node.parentId;
        }

        const connectionEdges = edges.filter(e => e.source === nodeId || e.target === nodeId);
        for (const edge of connectionEdges) {
            const otherId = edge.source === nodeId ? edge.target : edge.source;
            const otherNode = nodes.find(n => n.id === otherId);
            if (otherNode && otherNode.data.type === targetType) {
                return otherNode.data.name || otherNode.id.replace(/-/g, '_');
            }
        }
        return null;
    };

    if (gcpNodes.length > 0) {
        hasGCP = true;
        tf += `provider "google" {\n  project = "my-gcp-project"\n  region  = "${getRegion(gcpNodes[0])}"\n}\n\n`;
    }

    gcpNodes.forEach(node => {
        const { id, data } = node;
        const name = data.name || id.replace(/-/g, '_');

        if (data.type === 'vpc') {
            tf += `resource "google_compute_network" "${name}" {\n`;
            tf += `  name                    = "${name.replace(/_/g, '-')}-vpc"\n`;
            tf += `  auto_create_subnetworks = false\n}\n\n`;
        }
        else if (data.type === 'subnet') {
            const vpcName = resolveDependency(id, 'vpc') || 'main'; // fallback
            tf += `resource "google_compute_subnetwork" "${name}" {\n`;
            tf += `  name          = "${name.replace(/_/g, '-')}-subnet"\n`;
            tf += `  ip_cidr_range = "${data.cidr || '10.0.1.0/24'}"\n`;
            tf += `  region        = "${getRegion(node)}"\n`;
            tf += `  network       = google_compute_network.${vpcName}.id\n}\n\n`;
        }
        else if (data.type === 'compute') {
            const vpcName = resolveDependency(id, 'vpc') || 'main';
            const subnetName = resolveDependency(id, 'subnet') || 'main';
            tf += `resource "google_compute_instance" "${name}" {\n`;
            tf += `  name         = "${name.replace(/_/g, '-')}-vm"\n`;
            tf += `  machine_type = "${data.size || 'e2-micro'}"\n`;
            tf += `  zone         = "${getRegion(node)}-a"\n`;
            tf += `  boot_disk {\n    initialize_params {\n      image = "debian-cloud/debian-11"\n`;
            if (data.disk) tf += `      size  = ${data.disk}\n`;
            tf += `    }\n  }\n`;
            tf += `  network_interface {\n    network    = google_compute_network.${vpcName}.id\n    subnetwork = google_compute_subnetwork.${subnetName}.id\n  }\n}\n\n`;
        }
        else if (data.type === 'firewall') {
            const vpcName = resolveDependency(id, 'vpc') || 'main';
            tf += `resource "google_compute_firewall" "${name}" {\n`;
            tf += `  name    = "${name.replace(/_/g, '-')}-fw"\n`;
            tf += `  network = google_compute_network.${vpcName}.name\n`;
            tf += `  # Use edges to define rules for this VPC\n}\n\n`;
        }
        else if (data.type === 'kubernetes') {
            const vpcName = resolveDependency(id, 'vpc') || 'main';
            const subnetName = resolveDependency(id, 'subnet') || 'main';
            tf += `resource "google_container_cluster" "${name}" {\n`;
            tf += `  name               = "${name.replace(/_/g, '-')}-gke"\n`;
            tf += `  location           = "${getRegion(node)}"\n`;
            tf += `  initial_node_count = ${data.count || 3}\n`;
            tf += `  network            = google_compute_network.${vpcName}.id\n`;
            tf += `  subnetwork         = google_compute_subnetwork.${subnetName}.id\n`;
            tf += `  node_config {\n    machine_type = "${data.size || 'e2-medium'}"\n  }\n}\n\n`;
        }
        else if (data.type === 'storage') {
            tf += `resource "google_storage_bucket" "${name}" {\n`;
            tf += `  name          = "${name.toLowerCase().replace(/_/g, '-')}-bucket"\n`;
            tf += `  location      = "${getRegion(node)}"\n`;
            tf += `  force_destroy = true\n`;
            tf += `  uniform_bucket_level_access = true\n}\n\n`;
        }
        else if (data.type === 'disk') {
            const computeName = resolveDependency(id, 'compute');
            tf += `resource "google_compute_disk" "${name}" {\n`;
            tf += `  name  = "${name.toLowerCase().replace(/_/g, '-')}-disk"\n`;
            tf += `  type  = "pd-standard"\n`;
            tf += `  zone  = "${getRegion(node)}-a"\n`;
            tf += `  size  = ${data.disk || 20}\n}\n\n`;

            if (computeName) {
                tf += `resource "google_compute_attached_disk" "${name}_att" {\n`;
                tf += `  disk     = google_compute_disk.${name}.id\n`;
                tf += `  instance = google_compute_instance.${computeName}.id\n}\n\n`;
            }
        }
    });

    // --- Network Orchestration (VPC Peering) ---
    edges.forEach((edge, idx) => {
        const sourceNode = nodes.find(n => n.id === edge.source);
        const targetNode = nodes.find(n => n.id === edge.target);

        if (!sourceNode || !targetNode) return;

        const sourceName = sourceNode.data.name || sourceNode.id.replace(/-/g, '_');
        const targetName = targetNode.data.name || targetNode.id.replace(/-/g, '_');

        if (sourceNode.data.type === 'vpc' && targetNode.data.type === 'vpc' && sourceNode.data.provider === 'gcp' && targetNode.data.provider === 'gcp') {
            tf += `resource "google_compute_network_peering" "peer_${idx}" {\n`;
            tf += `  name         = "peer-${idx}"\n`;
            tf += `  network      = google_compute_network.${sourceName}.id\n`;
            tf += `  peer_network = google_compute_network.${targetName}.id\n}\n\n`;
        }
    });

    // --- Network Connections (Edges to Firewall Rules) ---
    edges.forEach((edge, idx) => {
        const targetNode = nodes.find(n => n.id === edge.target);
        const sourceNode = nodes.find(n => n.id === edge.source);

        if (targetNode && targetNode.data.provider === 'gcp' && !['vpc', 'subnet'].includes(targetNode.data.type)) {
            const vpcName = resolveDependency(targetNode.id, 'vpc') || 'main';
            let proto = edge.data?.protocol === 'all' ? 'all' : (edge.data?.protocol || 'tcp');
            let portStr = (edge.data?.port || '').toString();
            if (proto === 'http') { proto = 'tcp'; portStr = '80'; }
            else if (proto === 'https') { proto = 'tcp'; portStr = '443'; }

            tf += `resource "google_compute_firewall" "rule_${idx}" {\n`;
            tf += `  name    = "rule-${idx}"\n`;
            tf += `  network = google_compute_network.${vpcName}.name\n`;
            tf += `  allow {\n`;
            tf += `    protocol = "${proto}"\n`;
            if (portStr && portStr !== '*') {
                tf += `    ports    = ["${portStr}"]\n`;
            }
            tf += `  }\n`;
            tf += `  source_ranges = ["${sourceNode?.data.cidr || '0.0.0.0/0'}"]\n}\n\n`;
        }
    });

    return hasGCP ? tf : '';
}
