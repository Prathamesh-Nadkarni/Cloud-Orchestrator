export function generateK8s(nodes, edges = []) {
  let yaml = '';
  // Only process Kubernetes-specific entities, ignore the clusters/VMs
  const k8sNodes = nodes.filter(n => ['k8sPod', 'k8sService', 'k8sNode'].includes(n.data.type));

  if (k8sNodes.length === 0) return '';

  yaml += `# --- Kubernetes Manifests ---\n`;

  k8sNodes.forEach(node => {
    const parent = nodes.find(p => p.id === node.parentId);
    const isCloudK8s = parent && ['vpc', 'vnet'].includes(parent.data.type);

    if (isCloudK8s || node.data.provider === 'kubernetes') {
      const name = (node.data.name || node.type + '-' + node.id.split('-').pop()).toLowerCase().replace(/_/g, '-');

      if (node.data.type === 'k8sPod') {
        yaml += `
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${name}
spec:
  replicas: 1
  selector:
    matchLabels:
      app: ${name}
  template:
    metadata:
      labels:
        app: ${name}
    spec:
      containers:
      - name: ${name}
        image: nginx:latest
`;
      } else if (node.data.type === 'k8sService') {
        yaml += `
---
apiVersion: v1
kind: Service
metadata:
  name: ${name}
spec:
  selector:
    app: ${name}
  ports:
  - protocol: TCP
    port: 80
    targetPort: 80
`;
      } else if (node.data.type === 'k8sNode') {
        yaml += `
# --- Note: Kubernetes Worker Node '${name}' ---
# Worker nodes are typically managed via cloud provider node groups or cluster configuration.
# No direct YAML manifest is required for the node entity itself.
`;
      }
    }
  });

  // Generate NetworkPolicies based on edges between pods
  const pods = k8sNodes.filter(n => n.data.type === 'k8sPod');
  pods.forEach(pod => {
    const podName = (pod.data.name || pod.type + '-' + pod.id.split('-').pop()).toLowerCase().replace(/_/g, '-');

    // Find edges where this pod is the target (receiving traffic)
    const ingressEdges = edges.filter(e => e.target === pod.id);

    if (ingressEdges.length > 0) {
      yaml += `
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-${podName}-ingress
spec:
  podSelector:
    matchLabels:
      app: ${podName}
  policyTypes:
  - Ingress
  ingress:
`;
      ingressEdges.forEach(edge => {
        const sourceNode = nodes.find(n => n.id === edge.source);
        if (sourceNode && sourceNode.data.type === 'k8sPod') {
          const sourceName = (sourceNode.data.name || sourceNode.type + '-' + sourceNode.id.split('-').pop()).toLowerCase().replace(/_/g, '-');
          yaml += `  - from:\n`;
          yaml += `    - podSelector:\n`;
          yaml += `        matchLabels:\n`;
          yaml += `          app: ${sourceName}\n`;

          if (edge.data?.port && edge.data.port !== '*') {
            const proto = edge.data.protocol === 'udp' ? 'UDP' : 'TCP';
            let port = edge.data.port;
            if (edge.data.protocol === 'http') port = '80';
            if (edge.data.protocol === 'https') port = '443';

            yaml += `    ports:\n`;
            yaml += `    - protocol: ${proto}\n`;
            yaml += `      port: ${port}\n`;
          }
        }
      });
    }
  });

  return yaml;
}
