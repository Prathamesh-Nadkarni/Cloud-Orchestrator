<script lang="ts">
  import { Handle, Position, NodeResizer } from "@xyflow/svelte";
  import {
    Cloud,
    Server,
    Box,
    Globe,
    Shield,
    GitBranch,
    Lock,
    Container,
    Database,
    HardDrive,
    Cpu,
    Blocks,
    Network,
  } from "lucide-svelte";

  let { data, isConnectable, selected, width, height } = $props<{
    data: any;
    isConnectable: boolean;
    selected: boolean;
    width?: number;
    height?: number;
  }>();

  function getIcon(type: string) {
    switch (type) {
      case "vpc":
        return Cloud;
      case "vnet":
        return Cloud;
      case "subnet":
        return Box;
      case "compute":
        return Server;
      case "transit":
        return Globe;
      case "spoke":
        return GitBranch;
      case "firewall":
        return Shield;
      case "securityGroup":
        return Lock;
      case "networkGroup":
        return Lock;
      case "kubernetes":
        return Container;
      case "k8sNode":
        return Cpu;
      case "k8sPod":
        return Blocks;
      case "k8sService":
        return Network;
      case "storage":
        return Database;
      case "disk":
        return HardDrive;
      case "internet":
        return Globe;
      case "onprem":
        return Server;
      default:
        return Box;
    }
  }

  let sizingLevel = $derived.by(() => {
    const type = data.type;
    if (["vpc", "vnet"].includes(type)) return 1;
    if (["subnet", "kubernetes"].includes(type)) return 2;
    if (["securityGroup", "networkGroup", "k8sNode"].includes(type)) return 3;
    return 0;
  });

  let Icon = $derived(getIcon(data.type));
</script>

<div
  class="cloud-node {sizingLevel > 0 ? 'container-node' : 'resource-node'}"
  class:selected
  data-level={sizingLevel}
  style="--node-accent: var(--accent-{data.provider}); {width
    ? `width: ${width}px;`
    : ''} {height ? `height: ${height}px;` : ''}"
>
  <NodeResizer
    isVisible={selected}
    minWidth={sizingLevel === 1
      ? 400
      : sizingLevel === 2
        ? 300
        : sizingLevel === 3
          ? 200
          : 160}
    minHeight={sizingLevel === 1
      ? 300
      : sizingLevel === 2
        ? 200
        : sizingLevel === 3
          ? 120
          : 80}
    handleStyle="border: 22px solid transparent; background: transparent; width: 12px; height: 12px; border-radius: 3px; z-index: 50;"
    lineStyle="border-color: var(--node-accent); border-width: 2px; z-index: 49;"
  />
  <Handle
    type="target"
    position={Position.Left}
    {isConnectable}
    class="handle"
  />

  <div class="node-header">
    <div class="node-icon">
      <Icon size={16} />
    </div>
    <div class="node-title">
      <span class="provider">{data.provider.toUpperCase()}</span>
      <span class="label">{data.label}</span>
    </div>
  </div>

  {#if data.name || data.cidr || data.size}
    <div class="node-details">
      {#if data.name}
        <div class="detail-row">
          <span class="key">Name:</span> <span class="val">{data.name}</span>
        </div>
      {/if}
      {#if data.cidr}
        <div class="detail-row">
          <span class="key">CIDR:</span> <span class="val">{data.cidr}</span>
        </div>
      {/if}
      {#if data.size}
        <div class="detail-row">
          <span class="key">Size:</span> <span class="val">{data.size}</span>
        </div>
      {/if}
    </div>
  {/if}

  <Handle
    type="source"
    position={Position.Right}
    {isConnectable}
    class="handle"
  />
</div>

<style>
  .cloud-node {
    background: rgba(20, 22, 28, 0.95);
    backdrop-filter: blur(8px);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 12px;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    transition:
      box-shadow 0.2s,
      border-color 0.2s;
    font-family: var(--font-sans);
    display: flex;
    flex-direction: column;
    overflow: visible;
  }

  /* Styling for nested containers */
  .container-node {
    background: rgba(20, 22, 28, 0.3);
    border: 2px dashed rgba(255, 255, 255, 0.2);
  }

  /* Default/Minimum sizes only when not being constrained by parent or resizer */
  .cloud-node:not([style*="width"]) {
    min-width: 160px;
    min-height: 80px;
  }

  /* Level 1: Root Containers (VPC/VNet) */
  .cloud-node[data-level="1"]:not([style*="width"]) {
    width: 800px;
    height: 600px;
  }

  /* Level 2: Mid-tier Containers (Subnets/Clusters) */
  .cloud-node[data-level="2"]:not([style*="width"]) {
    width: 450px;
    height: 350px;
  }

  /* Level 3: Small Containers (Security Groups / K8s Nodes) */
  .cloud-node[data-level="3"]:not([style*="width"]) {
    width: 250px;
    height: 180px;
  }

  .cloud-node:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    border-color: rgba(255, 255, 255, 0.3);
  }

  /* When the node is selected via svelte-flow */
  .cloud-node:global(.selected) {
    border-color: var(--node-accent);
    box-shadow:
      0 0 0 1px var(--node-accent),
      0 4px 20px rgba(0, 0, 0, 0.4);
  }

  .node-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
  }

  .node-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 6px;
    color: var(--node-accent);
  }

  .node-title {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .provider {
    font-size: 0.6rem;
    font-weight: 700;
    letter-spacing: 0.5px;
    color: var(--text-muted);
  }

  .label {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-main);
  }

  .node-details {
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 0.75rem;
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    gap: 12px;
  }

  .key {
    color: var(--text-muted);
  }

  .val {
    color: var(--text-main);
    font-family: "Fira Code", monospace;
  }

  :global(.handle) {
    background: var(--bg-dark);
    border: 2px solid var(--node-accent);
    width: 12px;
    height: 12px;
    z-index: 100;
  }
</style>
