<script>
  import {
    Cloud,
    Server,
    Box,
    Globe,
    Shield,
    GitBranch,
    Lock,
    Network,
    Container,
    Database,
    HardDrive,
    Cpu,
    Blocks,
    Search,
  } from "lucide-svelte";
  import { globalState, clearDragState } from "$lib/client/state.svelte";

  const providers = [
    {
      id: "aws",
      name: "AWS",
      color: "var(--accent-aws)",
      resources: [
        { type: "vpc", label: "VPC", icon: Cloud },
        { type: "subnet", label: "Subnet", icon: Box },
        { type: "securityGroup", label: "Security Group", icon: Lock },
        { type: "compute", label: "EC2 Instance", icon: Server },
        { type: "kubernetes", label: "EKS Cluster", icon: Container },
        { type: "storage", label: "S3 Bucket", icon: Database },
        { type: "disk", label: "EBS Volume", icon: HardDrive },
      ],
    },
    {
      id: "azure",
      name: "Azure",
      color: "var(--accent-azure)",
      resources: [
        { type: "vnet", label: "VNet", icon: Cloud },
        { type: "subnet", label: "Subnet", icon: Box },
        { type: "networkGroup", label: "Network Sec Group", icon: Lock },
        { type: "compute", label: "Azure VM", icon: Server },
        { type: "kubernetes", label: "AKS Cluster", icon: Container },
        { type: "storage", label: "Blob Storage", icon: Database },
        { type: "disk", label: "Managed Disk", icon: HardDrive },
      ],
    },
    {
      id: "gcp",
      name: "Google Cloud",
      color: "var(--accent-gcp)",
      resources: [
        { type: "vpc", label: "VPC Network", icon: Cloud },
        { type: "subnet", label: "Subnetwork", icon: Box },
        { type: "firewall", label: "Firewall Rule", icon: Shield },
        { type: "compute", label: "Compute Engine", icon: Server },
        { type: "kubernetes", label: "GKE Cluster", icon: Container },
        { type: "storage", label: "Cloud Storage", icon: Database },
        { type: "disk", label: "Persistent Disk", icon: HardDrive },
      ],
    },
    {
      id: "kubernetes",
      name: "Kubernetes",
      color: "#326CE5",
      resources: [
        { type: "k8sNode", label: "K8s Node", icon: Cpu },
        { type: "k8sPod", label: "K8s Pod", icon: Blocks },
        { type: "k8sService", label: "K8s Service", icon: Network },
      ],
    },
    {
      id: "aviatrix",
      name: "Aviatrix",
      color: "var(--accent-avx)",
      resources: [
        { type: "transit", label: "Transit Gateway", icon: Globe },
        { type: "spoke", label: "Spoke Gateway", icon: GitBranch },
        { type: "firewall", label: "Firenet", icon: Shield },
        { type: "dcf", label: "DCF Policy", icon: Shield },
      ],
    },
    {
      id: "external",
      name: "External Entity",
      color: "#6b7280",
      resources: [
        { type: "internet", label: "Internet (0.0.0.0/0)", icon: Globe },
        { type: "onprem", label: "On-Premise Datacenter", icon: Server },
      ],
    },
    {
      id: "ai",
      name: "AI Workloads",
      color: "#8b5cf6",
      resources: [
        { type: "modelServing", label: "Model Serving", icon: Cpu },
        { type: "vectorDB", label: "Vector DB", icon: Database },
        { type: "trainingCluster", label: "Training Cluster", icon: Server },
        { type: "aiGateway", label: "AI Gateway", icon: Globe },
        { type: "modelRegistry", label: "Model Registry", icon: Box },
        { type: "externalModelAPI", label: "External Model API", icon: Cloud },
      ],
    },
  ];

  let searchQuery = $state("");

  let filteredProviders = $derived(
    providers
      .map((p) => ({
        ...p,
        resources: p.resources.filter(
          (r) =>
            r.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.name.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
      }))
      .filter((p) => p.resources.length > 0),
  );

  const onDragStart = (event, resourceType, label, providerId) => {
    event.dataTransfer.setData("application/svelteflow", resourceType);
    event.dataTransfer.setData("application/label", label);
    event.dataTransfer.setData("application/provider", providerId);
    event.dataTransfer.effectAllowed = "move";
    globalState.dragContext = { type: resourceType, provider: providerId };
  };

  const onDragEnd = () => {
    clearDragState();
  };
</script>

<aside class="sidebar glass-panel">
  <div class="sidebar-header">
    <h3>Resources</h3>
    <p class="sidebar-hint">Drag blocks onto the canvas to build your architecture</p>
    <div class="search-box">
      <Search size={14} class="search-icon" />
      <input
        type="text"
        placeholder="Search blocks..."
        bind:value={searchQuery}
      />
    </div>
  </div>

  <div class="provider-list">
    {#if filteredProviders.length === 0}
      <div class="empty-sidebar">
        <Search size={32} opacity="0.2" />
        <p>No blocks found</p>
      </div>
    {/if}
    {#each filteredProviders as provider}
      <div class="provider-section">
        <div
          class="provider-header"
          style="border-left-color: {provider.color}"
        >
          <h4>{provider.name}</h4>
        </div>

        <div class="resource-grid">
          {#each provider.resources as resource}
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
              class="resource-item"
              draggable={true}
              ondragstart={(e) =>
                onDragStart(e, resource.type, resource.label, provider.id)}
              ondragend={onDragEnd}
              title="Drag to canvas — {resource.label}"
            >
              <div class="resource-icon" style="color: {provider.color}">
                <resource.icon size={18} />
              </div>
              <span class="resource-label">{resource.label}</span>
              <div class="drag-grip">⠿</div>
            </div>
          {/each}
        </div>
      </div>
    {/each}
  </div>
</aside>

<style>
  .sidebar {
    width: 260px;
    height: 100%;
    border-radius: 0;
    border-top: none;
    border-bottom: none;
    border-left: none;
    display: flex;
    flex-direction: column;
    background: rgba(15, 17, 21, 0.85);
    z-index: 40;
  }

  .sidebar-header {
    padding: 20px 16px 16px;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .sidebar-header h3 {
    font-size: 1rem;
    font-weight: 600;
    margin: 0;
    letter-spacing: -0.3px;
  }

  .sidebar-hint {
    font-size: 0.72rem;
    color: var(--text-muted);
    margin: 0;
    line-height: 1.3;
    opacity: 0.7;
  }

  .search-box {
    position: relative;
    display: flex;
    align-items: center;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 0 12px;
    transition: all 0.2s;
  }

  .search-box:focus-within {
    border-color: var(--accent-primary);
    background: rgba(255, 255, 255, 0.05);
  }

  .search-icon {
    color: var(--text-muted);
  }

  .search-box input {
    background: none;
    border: none;
    color: var(--text-main);
    padding: 8px;
    flex: 1;
    outline: none;
    font-size: 0.85rem;
  }

  .empty-sidebar {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    color: var(--text-muted);
    text-align: center;
    gap: 12px;
  }

  .empty-sidebar p {
    font-size: 0.85rem;
  }

  .provider-list {
    flex: 1;
    overflow-y: auto;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .provider-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .provider-header {
    border-left: 3px solid transparent;
    padding-left: 8px;
  }

  .provider-header h4 {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-muted);
  }

  .resource-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
  }

  .resource-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 10px 6px 8px;
    background: var(--bg-panel);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    cursor: grab;
    transition: all 0.2s ease;
    position: relative;
  }

  .resource-item:hover {
    background: var(--bg-panel-hover);
    border-color: var(--border-focus);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  .resource-item:hover .drag-grip {
    opacity: 0.6;
  }

  .resource-item:active {
    cursor: grabbing;
    transform: translateY(0);
  }

  .resource-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 6px;
  }

  .resource-label {
    font-size: 0.7rem;
    text-align: center;
    color: var(--text-muted);
    font-weight: 500;
    line-height: 1.2;
  }

  .drag-grip {
    position: absolute;
    top: 3px;
    right: 5px;
    font-size: 0.55rem;
    color: var(--text-muted);
    opacity: 0;
    transition: opacity 0.2s;
    pointer-events: none;
    letter-spacing: -1px;
  }
</style>
