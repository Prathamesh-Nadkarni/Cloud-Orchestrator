export function generateAWS(nodes, edges = []) {
  let tf = `\n# --- AWS Resources ---\n`;
  let hasAWS = false;

  const getRegion = (n) => n.data.region || 'us-east-1';

  // Helper to find connected node of a specific type (checks parent hierarchy first, then edges)
  const resolveDependency = (nodeId, targetType) => {
    let currentId = nodeId;
    while (currentId) {
      const node = nodes.find(n => n.id === currentId);
      if (!node) break;
      if (node.id !== nodeId && node.data.type === targetType) {
        return node.data.name || node.id.replace(/-/g, '_');
      }
      currentId = node.parentNode;
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

  if (nodes.length > 0) {
    hasAWS = true;
    tf += `provider "aws" {\n  region = "${getRegion(nodes[0])}"\n}\n\n`;
  }

  nodes.forEach(node => {
    const { id, data } = node;
    const name = data.name || id.replace(/-/g, '_');

    if (data.type === 'vpc') {
      tf += `resource "aws_vpc" "${name}" {\n`;
      tf += `  cidr_block = "${data.cidr || '10.0.0.0/16'}"\n`;
      tf += `  enable_dns_support = true\n`;
      tf += `  enable_dns_hostnames = true\n`;
      tf += `  tags = {\n    Name = "${name}"\n  }\n}\n\n`;
    }
    else if (data.type === 'subnet') {
      const vpcName = resolveDependency(id, 'vpc') || 'main'; // fallback
      tf += `resource "aws_subnet" "${name}" {\n`;
      tf += `  vpc_id            = aws_vpc.${vpcName}.id\n`;
      tf += `  cidr_block        = "${data.cidr || '10.0.1.0/24'}"\n`;
      tf += `  tags = {\n    Name = "${name}"\n  }\n}\n\n`;
    }
    else if (data.type === 'compute') {
      const subnetName = resolveDependency(id, 'subnet') || 'main';
      const sgName = resolveDependency(id, 'securityGroup');

      tf += `resource "aws_instance" "${name}" {\n`;
      tf += `  ami           = "ami-0c55b159cbfafe1f0" # Amazon Linux 2\n`;
      tf += `  instance_type = "${data.size || 't2.micro'}"\n`;
      tf += `  subnet_id     = aws_subnet.${subnetName}.id\n`;

      if (sgName) {
        tf += `  vpc_security_group_ids = [aws_security_group.${sgName}.id]\n`;
      }

      if (data.disk) {
        tf += `  root_block_device {\n    volume_size = ${data.disk}\n  }\n`;
      }
      tf += `  tags = {\n    Name = "${name}"\n  }\n}\n\n`;
    }
    else if (data.type === 'securityGroup') {
      const vpcName = resolveDependency(id, 'vpc') || 'main';
      tf += `resource "aws_security_group" "${name}" {\n`;
      tf += `  name        = "${name}-sg"\n`;
      tf += `  description = "Managed by Multicloud Designer"\n`;
      tf += `  vpc_id      = aws_vpc.${vpcName}.id\n`;

      const sgChildren = nodes.filter(n => n.parentNode === id).map(n => n.id);
      const relevantEdges = edges.filter(e => sgChildren.includes(e.source) || sgChildren.includes(e.target) || e.source === id || e.target === id);

      let ingressAdded = false;
      let egressAdded = false;

      relevantEdges.forEach(edge => {
        const isIngress = sgChildren.includes(edge.target) || edge.target === id;
        const isEgress = sgChildren.includes(edge.source) || edge.source === id;

        let proto = edge.data?.protocol === 'all' ? '-1' : (edge.data?.protocol || 'tcp');
        let portStr = (edge.data?.port || '0').toString();
        let fromPort = 0;
        let toPort = 0;

        if (proto === 'http') { proto = 'tcp'; fromPort = 80; toPort = 80; }
        else if (proto === 'https') { proto = 'tcp'; fromPort = 443; toPort = 443; }
        else if (portStr !== '*' && proto !== '-1') {
          if (portStr.includes('-')) {
            const parts = portStr.split('-');
            fromPort = parseInt(parts[0]) || 0;
            toPort = parseInt(parts[1]) || 0;
          } else {
            fromPort = parseInt(portStr) || 0;
            toPort = parseInt(portStr) || 0;
          }
        }

        if (isIngress) {
          tf += `  ingress {\n    from_port   = ${fromPort}\n    to_port     = ${toPort}\n    protocol    = "${proto}"\n    cidr_blocks = ["0.0.0.0/0"]\n  }\n`;
          ingressAdded = true;
        }
        if (isEgress) {
          tf += `  egress {\n    from_port   = ${fromPort}\n    to_port     = ${toPort}\n    protocol    = "${proto}"\n    cidr_blocks = ["0.0.0.0/0"]\n  }\n`;
          egressAdded = true;
        }
      });

      if (!ingressAdded && !egressAdded) {
        tf += `  ingress {\n    from_port   = 0\n    to_port     = 0\n    protocol    = "-1"\n    cidr_blocks = ["0.0.0.0/0"]\n  }\n`;
        tf += `  egress {\n    from_port   = 0\n    to_port     = 0\n    protocol    = "-1"\n    cidr_blocks = ["0.0.0.0/0"]\n  }\n`;
      }
      tf += `}\n\n`;
    }
    else if (data.type === 'kubernetes') {
      const subnetName = resolveDependency(id, 'subnet') || 'main';
      tf += `resource "aws_eks_cluster" "${name}" {\n`;
      tf += `  name     = "${name}-eks"\n`;
      tf += `  role_arn = aws_iam_role.eks_cluster.arn # Requires IAM Setup\n`;
      tf += `  vpc_config {\n    subnet_ids = [aws_subnet.${subnetName}.id]\n  }\n}\n\n`;
      tf += `resource "aws_eks_node_group" "${name}_nodes" {\n`;
      tf += `  cluster_name    = aws_eks_cluster.${name}.name\n`;
      tf += `  node_group_name = "${name}-nodes"\n`;
      tf += `  node_role_arn   = aws_iam_role.eks_nodes.arn # Requires IAM Setup\n`;
      tf += `  subnet_ids      = aws_eks_cluster.${name}.vpc_config[0].subnet_ids\n`;
      tf += `  scaling_config {\n    desired_size = ${data.count || 3}\n    max_size     = ${data.count || 3} + 1\n    min_size     = 1\n  }\n`;
      tf += `  instance_types  = ["${data.size || 't3.medium'}"]\n}\n\n`;
    }
    else if (data.type === 'storage') {
      tf += `resource "aws_s3_bucket" "${name}" {\n`;
      tf += `  bucket = "${name.toLowerCase().replace(/_/g, '-')}-bucket"\n`;
      tf += `  tags = {\n    Name = "${name}"\n  }\n}\n\n`;
    }
    else if (data.type === 'disk') {
      const computeName = resolveDependency(id, 'compute');
      tf += `resource "aws_ebs_volume" "${name}" {\n`;
      tf += `  availability_zone = "\${var.aws_region}a"\n`;
      tf += `  size              = ${data.disk || 20}\n`;
      tf += `  tags = {\n    Name = "${name}"\n  }\n}\n\n`;

      if (computeName) {
        tf += `resource "aws_volume_attachment" "${name}_att" {\n`;
        tf += `  device_name = "/dev/sdh"\n`;
        tf += `  volume_id   = aws_ebs_volume.${name}.id\n`;
        tf += `  instance_id = aws_instance.${computeName}.id\n}\n\n`;
      }
    }
  });

  return hasAWS ? tf : '';
}
