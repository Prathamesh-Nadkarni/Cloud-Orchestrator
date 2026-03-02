<script>
  import { Cloud, Server, Box, Globe, Shield, GitBranch, Lock, Network, Container, Database, HardDrive, Cpu, Blocks } from 'lucide-svelte';

  const providers = [
    {
      id: 'aws',
      name: 'AWS',
      color: 'var(--accent-aws)',
      resources: [
        { type: 'vpc', label: 'VPC', icon: Cloud },
        { type: 'subnet', label: 'Subnet', icon: Box },
        { type: 'securityGroup', label: 'Security Group', icon: Lock },
        { type: 'compute', label: 'EC2 Instance', icon: Server },
        { type: 'kubernetes', label: 'EKS Cluster', icon: Container },
        { type: 'storage', label: 'S3 Bucket', icon: Database },
        { type: 'disk', label: 'EBS Volume', icon: HardDrive }
      ]
    },
    {
      id: 'azure',
      name: 'Azure',
      color: 'var(--accent-azure)',
      resources: [
        { type: 'vnet', label: 'VNet', icon: Cloud },
        { type: 'subnet', label: 'Subnet', icon: Box },
        { type: 'networkGroup', label: 'Network Sec Group', icon: Lock },
        { type: 'compute', label: 'Azure VM', icon: Server },
        { type: 'kubernetes', label: 'AKS Cluster', icon: Container },
        { type: 'storage', label: 'Blob Storage', icon: Database },
        { type: 'disk', label: 'Managed Disk', icon: HardDrive }
      ]
    },
    {
      id: 'gcp',
      name: 'Google Cloud',
      color: 'var(--accent-gcp)',
      resources: [
        { type: 'vpc', label: 'VPC Network', icon: Cloud },
        { type: 'subnet', label: 'Subnetwork', icon: Box },
        { type: 'firewall', label: 'Firewall Rule', icon: Shield },
        { type: 'compute', label: 'Compute Engine', icon: Server },
        { type: 'kubernetes', label: 'GKE Cluster', icon: Container },
        { type: 'storage', label: 'Cloud Storage', icon: Database },
        { type: 'disk', label: 'Persistent Disk', icon: HardDrive }
      ]
    },
    {
      id: 'kubernetes',
      name: 'Kubernetes',
      color: '#326CE5',
      resources: [
        { type: 'k8sNode', label: 'K8s Node', icon: Cpu },
        { type: 'k8sPod', label: 'K8s Pod', icon: Blocks },
        { type: 'k8sService', label: 'K8s Service', icon: Network }
      ]
    },
    {
      id: 'aviatrix',
      name: 'Aviatrix',
      color: 'var(--accent-avx)',
      resources: [
        { type: 'transit', label: 'Transit Gateway', icon: Globe },
        { type: 'spoke', label: 'Spoke Gateway', icon: GitBranch },
        { type: 'firewall', label: 'Firenet', icon: Shield }
      ]
    },
    {
      id: 'external',
      name: 'External Entity',
      color: '#6b7280',
      resources: [
        { type: 'internet', label: 'Internet (0.0.0.0/0)', icon: Globe },
        { type: 'onprem', label: 'On-Premise Datacenter', icon: Server }
      ]
    }
  ];

  const onDragStart = (event, resourceType, label, providerId) => {
    event.dataTransfer.setData('application/svelteflow', resourceType);
    event.dataTransfer.setData('application/label', label);
    event.dataTransfer.setData('application/provider', providerId);
    event.dataTransfer.effectAllowed = 'move';
  };
</script>

<aside class="sidebar glass-panel">
  <div class="sidebar-header">
    <h3>Resources</h3>
    <p>Drag onto the canvas</p>
  </div>

  <div class="provider-list">
    {#each providers as provider}
      <div class="provider-section">
        <div class="provider-header" style="border-left-color: {provider.color}">
          <h4>{provider.name}</h4>
        </div>
        
        <div class="resource-grid">
          {#each provider.resources as resource}
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div 
              class="resource-item"
              draggable={true}
              ondragstart={(e) => onDragStart(e, resource.type, resource.label, provider.id)}
            >
              <div class="resource-icon" style="color: {provider.color}">
                <resource.icon size={20} />
              </div>
              <span class="resource-label">{resource.label}</span>
            </div>
          {/each}
        </div>
      </div>
    {/each}
  </div>
</aside>

<style>
  .sidebar {
    width: 280px;
    height: 100%;
    border-radius: 0;
    border-top: none;
    border-bottom: none;
    border-left: none;
    display: flex;
    flex-direction: column;
    background: rgba(15, 17, 21, 0.85); /* Slightly darker */
    z-index: 40;
  }

  .sidebar-header {
    padding: 24px 20px 16px;
    border-bottom: 1px solid var(--border-color);
  }

  .sidebar-header h3 {
    font-size: 1.1rem;
    font-weight: 600;
    margin-bottom: 4px;
    letter-spacing: -0.3px;
  }

  .sidebar-header p {
    font-size: 0.85rem;
    color: var(--text-muted);
  }

  .provider-list {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .provider-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .provider-header {
    border-left: 3px solid transparent;
    padding-left: 8px;
  }

  .provider-header h4 {
    font-size: 0.9rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--text-main);
  }

  .resource-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .resource-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 8px;
    background: var(--bg-panel);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    cursor: grab;
    transition: all 0.2s ease;
  }

  .resource-item:hover {
    background: var(--bg-panel-hover);
    border-color: var(--border-focus);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  .resource-item:active {
    cursor: grabbing;
    transform: translateY(0);
  }

  .resource-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 6px;
  }

  .resource-label {
    font-size: 0.75rem;
    text-align: center;
    color: var(--text-muted);
    font-weight: 500;
  }
</style>
