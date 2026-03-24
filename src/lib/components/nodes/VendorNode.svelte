<script lang="ts">
    import { Handle, Position, type NodeProps } from "@xyflow/svelte";
    import {
        Shield,
        Network,
        Box,
        Database,
        ExternalLink,
    } from "lucide-svelte";

    let { data, selected }: NodeProps = $props();

    const iconMap: Record<string, any> = {
        Security: Shield,
        Networking: Network,
        Storage: Database,
        default: Box,
    };

    const Icon =
        iconMap[(data.category as string) || "default"] || iconMap.default;
</script>

<div class="vendor-node glass-panel" class:selected>
    <div class="node-header">
        <div class="icon-wrapper">
            <svelte:component this={Icon} size={18} color="var(--accent-avx)" />
        </div>
        <div class="header-text">
            <span class="vendor-label">{data.vendor || "Third Party"}</span>
            <span class="product-name">{data.label || "Plugin Node"}</span>
        </div>
    </div>

    <div class="node-content">
        {#if data.status}
            <div class="status-indicator">
                <span class="status-dot"></span>
                {data.status}
            </div>
        {/if}
    </div>

    {#if data.isMarketplace}
        <div class="marketplace-badge">
            <ExternalLink size={10} /> Marketplace
        </div>
    {/if}

    <!-- Standard Handles -->
    <Handle type="target" position={Position.Left} />
    <Handle type="source" position={Position.Right} />
    <Handle type="target" position={Position.Top} />
    <Handle type="source" position={Position.Bottom} />
</div>

<style>
    .vendor-node {
        padding: 12px;
        min-width: 180px;
        border-radius: 12px;
        border: 1px solid rgba(139, 92, 246, 0.3);
        background: rgba(15, 23, 42, 0.9);
        position: relative;
        transition: all 0.2s;
    }

    .vendor-node.selected {
        border-color: #8b5cf6;
        box-shadow: 0 0 20px rgba(139, 92, 246, 0.2);
    }

    .node-header {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .icon-wrapper {
        width: 32px;
        height: 32px;
        background: rgba(139, 92, 246, 0.1);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .header-text {
        display: flex;
        flex-direction: column;
    }

    .vendor-label {
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #94a3b8;
    }

    .product-name {
        font-size: 14px;
        font-weight: 600;
        color: #f8fafc;
    }

    .node-content {
        margin-top: 12px;
    }

    .status-indicator {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 11px;
        color: #94a3b8;
    }

    .status-dot {
        width: 6px;
        height: 6px;
        background: #10b981;
        border-radius: 50%;
    }

    .marketplace-badge {
        position: absolute;
        top: -8px;
        right: 8px;
        background: #8b5cf6;
        color: white;
        font-size: 9px;
        padding: 2px 6px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        gap: 4px;
        font-weight: 600;
    }
</style>
