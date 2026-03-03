export function generateAWS(nodes, edges = []) {
  let tf = `\n# --- AWS Resources ---\n`;
  const awsNodes = nodes.filter(n => n.data.provider === 'aws' || (n.data.provider === 'kubernetes' && nodes.find(p => p.id === n.parentId)?.data.provider === 'aws'));
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

  if (awsNodes.length > 0) {
    hasAWS = true;
    tf += `provider "aws" {\n  region = "${getRegion(awsNodes[0])}"\n}\n\n`;
  }

  awsNodes.forEach(node => {
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
      tf += `  description = "Security Group for ${name}"\n`;
      tf += `  vpc_id      = aws_vpc.${vpcName}.id\n`;
      tf += `  tags = {\n    Name = "${name}"\n  }\n}\n\n`;
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

  // --- Network Orchestration (VPC Peering & TGW Attachments) ---
  edges.forEach((edge, idx) => {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);

    if (!sourceNode || !targetNode) return;

    const sourceName = sourceNode.data.name || sourceNode.id.replace(/-/g, '_');
    const targetName = targetNode.data.name || targetNode.id.replace(/-/g, '_');

    // VPC Peering
    if (sourceNode.data.type === 'vpc' && targetNode.data.type === 'vpc' && sourceNode.data.provider === 'aws' && targetNode.data.provider === 'aws') {
      tf += `resource "aws_vpc_peering_connection" "peer_${idx}" {\n`;
      tf += `  peer_vpc_id = aws_vpc.${targetName}.id\n`;
      tf += `  vpc_id      = aws_vpc.${sourceName}.id\n`;
      tf += `  auto_accept = true\n}\n\n`;
    }

    // Transit Gateway Attachment
    if (sourceNode.data.type === 'vpc' && (targetNode.data.type === 'transit' || targetNode.data.type === 'spoke')) {
      tf += `resource "aws_ec2_transit_gateway_vpc_attachment" "tgw_attachment_${idx}" {\n`;
      tf += `  subnet_ids         = [aws_subnet.${resolveDependency(sourceNode.id, 'subnet') || 'main'}.id]\n`;
      tf += `  transit_gateway_id = aws_ec2_transit_gateway.${targetName}.id\n`;
      tf += `  vpc_id             = aws_vpc.${sourceName}.id\n}\n\n`;
    }
  });

  // --- Network Connections (Edges to SG Rules) ---
  edges.forEach((edge, idx) => {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);

    if (targetNode && targetNode.data.provider === 'aws' && !['vpc', 'subnet', 'transit', 'spoke'].includes(targetNode.data.type)) {
      const targetSg = resolveDependency(targetNode.id, 'securityGroup');
      if (targetSg) {
        let proto = edge.data?.protocol === 'all' ? '-1' : (edge.data?.protocol || 'tcp');
        let port = edge.data?.port || '0';
        let fromPort = 0;
        let toPort = 0;

        if (proto === 'http') { proto = 'tcp'; fromPort = 80; toPort = 80; }
        else if (proto === 'https') { proto = 'tcp'; fromPort = 443; toPort = 443; }
        else if (port !== '*' && proto !== '-1') {
          if (port.toString().includes('-')) {
            const parts = port.toString().split('-');
            fromPort = parseInt(parts[0]) || 0;
            toPort = parseInt(parts[1]) || 0;
          } else {
            fromPort = parseInt(port) || 0;
            toPort = parseInt(port) || 0;
          }
        }

        tf += `resource "aws_security_group_rule" "ingress_${idx}" {\n`;
        tf += `  type              = "ingress"\n`;
        tf += `  from_port         = ${fromPort}\n`;
        tf += `  to_port           = ${toPort}\n`;
        tf += `  protocol          = "${proto}"\n`;

        if (sourceNode?.data.type === 'internet' || !sourceNode) {
          tf += `  cidr_blocks       = ["0.0.0.0/0"]\n`;
        } else if (sourceNode.data.cidr) {
          tf += `  cidr_blocks       = ["${sourceNode.data.cidr}"]\n`;
        } else {
          const sourceSg = resolveDependency(sourceNode.id, 'securityGroup');
          if (sourceSg) {
            tf += `  source_security_group_id = aws_security_group.${sourceSg}.id\n`;
          } else {
            tf += `  cidr_blocks       = ["0.0.0.0/0"]\n`;
          }
        }
        tf += `  security_group_id = aws_security_group.${targetSg}.id\n}\n\n`;
      }
    }
  });

  return hasAWS ? tf : '';
}
