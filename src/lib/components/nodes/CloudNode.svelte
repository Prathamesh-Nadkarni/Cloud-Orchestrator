<script>
  import { Handle, Position } from '@xyflow/svelte';
  import { Cloud, Server, Box, Globe, Shield, GitBranch, Lock, Container, Database, HardDrive, Cpu, Blocks, Network } from 'lucide-svelte';

  let { data, isConnectable } = $props();

  function getIcon(type) {
    switch (type) {
      case 'vpc': return Cloud;
      case 'vnet': return Cloud;
      case 'subnet': return Box;
      case 'compute': return Server;
      case 'transit': return Globe;
      case 'spoke': return GitBranch;
      case 'firewall': return Shield;
      case 'securityGroup': return Lock;
      case 'networkGroup': return Lock;
      case 'kubernetes': return Container;
      case 'k8sNode': return Cpu;
      case 'k8sPod': return Blocks;
      case 'k8sService': return Network;
      case 'storage': return Database;
      case 'disk': return HardDrive;
      case 'internet': return Globe;
      case 'onprem': return Server;
      default: return Box;
    }
  }

  let Icon = $derived(getIcon(data.type));
</script>

<div class="cloud-node {['vpc', 'vnet', 'securityGroup', 'networkGroup', 'kubernetes', 'k8sNode'].includes(data.type) ? 'container-node' : ''}" class:selected={data.selected} style="--node-accent: var(--accent-{data.provider})">
  <Handle 
    type="target" 
    position={Position.Left} 
    isConnectable={isConnectable} 
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
        <div class="detail-row"><span class="key">Name:</span> <span class="val">{data.name}</span></div>
      {/if}
      {#if data.cidr}
        <div class="detail-row"><span class="key">CIDR:</span> <span class="val">{data.cidr}</span></div>
      {/if}
      {#if data.size}
        <div class="detail-row"><span class="key">Size:</span> <span class="val">{data.size}</span></div>
      {/if}
    </div>
  {/if}

  <Handle 
    type="source" 
    position={Position.Right} 
    isConnectable={isConnectable} 
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
    min-width: 160px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    transition: all 0.2s;
    font-family: var(--font-sans);
  }

  /* Styling for VPC nested containers */
  .container-node {
    min-width: 500px;
    min-height: 400px;
    background: rgba(20, 22, 28, 0.3);
    border: 2px dashed rgba(255, 255, 255, 0.2);
  }

  .cloud-node:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    border-color: rgba(255, 255, 255, 0.3);
  }

  /* When the node is selected via svelte-flow */
  .cloud-node:global(.selected) {
    border-color: var(--node-accent);
    box-shadow: 0 0 0 1px var(--node-accent), 0 4px 20px rgba(0, 0, 0, 0.4);
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
    font-family: 'Fira Code', monospace;
  }

  :global(.handle) {
    background: var(--bg-dark);
    border: 2px solid var(--node-accent);
    width: 10px;
    height: 10px;
  }
</style>
