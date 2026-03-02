export function generateAzure(nodes, edges = []) {
    let tf = `\n# --- Azure Resources ---\n`;
    const azureNodes = nodes.filter(n => n.data.provider === 'azure' || (n.data.provider === 'kubernetes' && nodes.find(p => p.id === n.parentId)?.data.provider === 'azure'));
    let hasAzure = false;

    const getLocation = (n) => n.data.region || 'East US';

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

    if (azureNodes.length > 0) {
        hasAzure = true;
        tf += `provider "azurerm" {\n  features {}\n}\n\n`;
        tf += `resource "azurerm_resource_group" "main" {\n`;
        tf += `  name     = "multicloud-rg"\n`;
        tf += `  location = "${getLocation(azureNodes[0])}"\n}\n\n`;
    }

    azureNodes.forEach(node => {
        const { id, data } = node;
        const name = data.name || id.replace(/-/g, '_');

        if (data.type === 'vnet') {
            tf += `resource "azurerm_virtual_network" "${name}" {\n`;
            tf += `  name                = "${name}-vnet"\n`;
            tf += `  location            = azurerm_resource_group.main.location\n`;
            tf += `  resource_group_name = azurerm_resource_group.main.name\n`;
            tf += `  address_space       = ["${data.cidr || '10.0.0.0/16'}"]\n}\n\n`;
        }
        else if (data.type === 'subnet') {
            const vnetName = resolveDependency(id, 'vnet') || 'main'; // fallback
            tf += `resource "azurerm_subnet" "${name}" {\n`;
            tf += `  name                 = "${name}-subnet"\n`;
            tf += `  resource_group_name  = azurerm_resource_group.main.name\n`;
            tf += `  virtual_network_name = azurerm_virtual_network.${vnetName}.name\n`;
            tf += `  address_prefixes     = ["${data.cidr || '10.0.1.0/24'}"]\n}\n\n`;
        }
        else if (data.type === 'compute') {
            const subnetName = resolveDependency(id, 'subnet') || 'main';
            const nsgName = resolveDependency(id, 'networkGroup');

            tf += `resource "azurerm_network_interface" "${name}_nic" {\n`;
            tf += `  name                = "${name}-nic"\n`;
            tf += `  location            = azurerm_resource_group.main.location\n`;
            tf += `  resource_group_name = azurerm_resource_group.main.name\n`;
            tf += `  ip_configuration {\n    name                          = "internal"\n    subnet_id                     = azurerm_subnet.${subnetName}.id\n    private_ip_address_allocation = "Dynamic"\n  }\n}\n\n`;

            if (nsgName) {
                tf += `resource "azurerm_network_interface_security_group_association" "${name}_nsg_assoc" {\n`;
                tf += `  network_interface_id      = azurerm_network_interface.${name}_nic.id\n`;
                tf += `  network_security_group_id = azurerm_network_security_group.${nsgName}.id\n}\n\n`;
            }

            tf += `resource "azurerm_linux_virtual_machine" "${name}" {\n`;
            tf += `  name                = "${name}-vm"\n`;
            tf += `  resource_group_name = azurerm_resource_group.main.name\n`;
            tf += `  location            = azurerm_resource_group.main.location\n`;
            tf += `  size                = "${data.size || 'Standard_B1s'}"\n`;
            tf += `  admin_username      = "adminuser"\n`;
            tf += `  network_interface_ids = [azurerm_network_interface.${name}_nic.id]\n`;
            if (data.disk) {
                tf += `  os_disk {\n    caching              = "ReadWrite"\n    storage_account_type = "Standard_LRS"\n    disk_size_gb         = ${data.disk}\n  }\n`;
            }
            tf += `  source_image_reference {\n    publisher = "Canonical"\n    offer     = "UbuntuServer"\n    sku       = "18.04-LTS"\n    version   = "latest"\n  }\n}\n\n`;
        }
        else if (data.type === 'networkGroup') {
            tf += `resource "azurerm_network_security_group" "${name}" {\n`;
            tf += `  name                = "${name}-nsg"\n`;
            tf += `  location            = azurerm_resource_group.main.location\n`;
            tf += `  resource_group_name = azurerm_resource_group.main.name\n`;

            const sgChildren = nodes.filter(n => n.parentId === id).map(n => n.id);
            const relevantEdges = edges.filter(e => sgChildren.includes(e.source) || sgChildren.includes(e.target) || e.source === id || e.target === id);

            let ruleIndex = 100;

            relevantEdges.forEach((edge, i) => {
                const isIngress = sgChildren.includes(edge.target) || edge.target === id;
                const isEgress = sgChildren.includes(edge.source) || edge.source === id;

                let proto = edge.data?.protocol === 'all' ? '*' : (edge.data?.protocol?.toUpperCase() || 'TCP');
                let portStr = (edge.data?.port || '*').toString();

                if (edge.data?.protocol === 'http') { proto = 'TCP'; portStr = '80'; }
                else if (edge.data?.protocol === 'https') { proto = 'TCP'; portStr = '443'; }

                const direction = isIngress ? 'Inbound' : 'Outbound';
                const ruleName = `rule-${direction.toLowerCase()}-${i}`;

                tf += `  security_rule {\n`;
                tf += `    name                       = "${ruleName}"\n`;
                tf += `    priority                   = ${ruleIndex++}\n`;
                tf += `    direction                  = "${direction}"\n`;
                tf += `    access                     = "Allow"\n`;
                tf += `    protocol                   = "${proto}"\n`;
                tf += `    source_port_range          = "*"\n`;
                tf += `    destination_port_range     = "${portStr}"\n`;
                tf += `    source_address_prefix      = "*"\n`;
                tf += `    destination_address_prefix = "*"\n`;
                tf += `  }\n`;
            });

            if (relevantEdges.length === 0) {
                tf += `  security_rule {\n    name                       = "AllowAllInbound"\n    priority                   = 100\n    direction                  = "Inbound"\n    access                     = "Allow"\n    protocol                   = "*"\n    source_port_range          = "*"\n    destination_port_range     = "*"\n    source_address_prefix      = "*"\n    destination_address_prefix = "*"\n  }\n`;
            }
            tf += `}\n\n`;
        }
        else if (data.type === 'kubernetes') {
            tf += `resource "azurerm_kubernetes_cluster" "${name}" {\n`;
            tf += `  name                = "${name}-aks"\n`;
            tf += `  location            = azurerm_resource_group.main.location\n`;
            tf += `  resource_group_name = azurerm_resource_group.main.name\n`;
            tf += `  dns_prefix          = "${name}-aks-dns"\n`;
            tf += `  default_node_pool {\n    name       = "default"\n    node_count = ${data.count || 3}\n    vm_size    = "${data.size || 'Standard_D2_v2'}"\n  }\n`;
            tf += `  identity {\n    type = "SystemAssigned"\n  }\n}\n\n`;
        }
        else if (data.type === 'storage') {
            const saneName = name.toLowerCase().replace(/_/g, '').substring(0, 24);
            tf += `resource "azurerm_storage_account" "${name}" {\n`;
            tf += `  name                     = "${saneName}"\n`;
            tf += `  resource_group_name      = azurerm_resource_group.main.name\n`;
            tf += `  location                 = azurerm_resource_group.main.location\n`;
            tf += `  account_tier             = "Standard"\n`;
            tf += `  account_replication_type = "LRS"\n}\n\n`;
        }
        else if (data.type === 'disk') {
            const computeName = resolveDependency(id, 'compute');
            tf += `resource "azurerm_managed_disk" "${name}" {\n`;
            tf += `  name                 = "${name}-disk"\n`;
            tf += `  location             = azurerm_resource_group.main.location\n`;
            tf += `  resource_group_name  = azurerm_resource_group.main.name\n`;
            tf += `  storage_account_type = "Standard_LRS"\n`;
            tf += `  create_option        = "Empty"\n`;
            tf += `  disk_size_gb         = ${data.disk || 20}\n}\n\n`;

            if (computeName) {
                tf += `resource "azurerm_virtual_machine_data_disk_attachment" "${name}_att" {\n`;
                tf += `  managed_disk_id    = azurerm_managed_disk.${name}.id\n`;
                tf += `  virtual_machine_id = azurerm_linux_virtual_machine.${computeName}.id\n`;
                tf += `  lun                = "10"\n`;
                tf += `  caching            = "ReadWrite"\n}\n\n`;
            }
        }
    });

    return hasAzure ? tf : '';
}
