<script lang="ts">
    import { Handle, Position, type NodeProps } from "@xyflow/svelte";
    import {
        Shield,
        Network,
        Box,
        Database,
        Eye,
        Key,
        CloudCog,
        CheckCircle2,
        AlertCircle,
        Info,
        ExternalLink,
    } from "lucide-svelte";

    let { data, selected }: NodeProps = $props();

    const iconMap: Record<string, any> = {
        Security: Shield,
        Networking: Network,
        Storage: Database,
        Observability: Eye,
        Identity: Key,
        Resilience: CloudCog,
        default: Box,
    };

    const Icon =
        iconMap[(data.category as string) || "default"] || iconMap.default;

    // Calculate integration readiness
    const integrationStatus = $derived.by(() => {
        const reqs = data.requirements || {};
        const config = data.configuration || {};

        const checks = {
            apiConfigured: config.apiKey || config.apiCredentials ? true : false,
            accountsConnected: config.connectedAccounts?.length > 0 || false,
            agentDeployed: !reqs.agent_deployment || config.agentDeployed || false,
            networkAccess: !reqs.network_access || config.networkConfigured || false,
        };

        const total = Object.keys(checks).length;
        const completed = Object.values(checks).filter(Boolean).length;

        return {
            percentage: Math.round((completed / total) * 100),
            ready: completed === total,
            checks,
        };
    });

    // Get requirement display list
    const requirementsList = $derived.by(() => {
        const reqs = data.requirements || {};
        const list = [];

        if (reqs.api_credentials || reqs.api_key) {
            list.push({ label: "API Credentials", met: integrationStatus.checks.apiConfigured });
        }
        if (reqs.cloud_account_access && reqs.cloud_account_access.length > 0) {
            list.push({
                label: `Cloud Accounts (${reqs.cloud_account_access.join(", ").toUpperCase()})`,
                met: integrationStatus.checks.accountsConnected,
            });
        }
        if (reqs.agent_deployment) {
            list.push({ label: "Agent Deployment", met: integrationStatus.checks.agentDeployed });
        }
        if (reqs.network_connectivity) {
            list.push({ label: "Network Access", met: integrationStatus.checks.networkAccess });
        }
        if (reqs.permissions && reqs.permissions.length > 0) {
            list.push({ label: `Permissions: ${reqs.permissions.join(", ")}`, met: false });
        }
        if (reqs.domain_verification) {
            list.push({ label: "Domain Verification", met: false });
        }
        if (reqs.dns_configuration) {
            list.push({ label: "DNS Configuration", met: false });
        }
        if (reqs.storage_access) {
            list.push({ label: "Storage Access", met: false });
        }
        if (reqs.vault_address) {
            list.push({ label: "Vault Address", met: false });
        }

        return list;
    });
</script>

<div class="vendor-integration-node glass-panel" class:selected class:ready={integrationStatus.ready}>
    <div class="node-header">
        <div class="icon-wrapper" style="background-color: {data.color || 'rgba(139, 92, 246, 0.1)'}20">
            <svelte:component this={Icon} size={18} color={data.color || "var(--accent-avx)"} />
        </div>
        <div class="header-text">
            <span class="vendor-label">{data.vendor || "Third Party"}</span>
            <span class="product-name">{data.label || "Integration"}</span>
        </div>
    </div>

    <div class="node-content">
        <!-- Integration Status Bar -->
        <div class="integration-status">
            <div class="status-header">
                <span class="status-label">Integration Status</span>
                <span class="status-percentage" class:ready={integrationStatus.ready}>
                    {integrationStatus.percentage}%
                </span>
            </div>
            <div class="progress-bar">
                <div 
                    class="progress-fill" 
                    class:ready={integrationStatus.ready}
                    style="width: {integrationStatus.percentage}%"
                ></div>
            </div>
        </div>

        <!-- Requirements Checklist -->
        {#if data.showRequirements !== false}
            <div class="requirements-list">
                <div class="requirements-header">
                    <Info size={12} />
                    <span>Setup Requirements</span>
                </div>
                {#each requirementsList.slice(0, 3) as req}
                    <div class="requirement-item">
                        {#if req.met}
                            <CheckCircle2 size={14} color="#10b981" />
                        {:else}
                            <AlertCircle size={14} color="#f59e0b" />
                        {/if}
                        <span class:met={req.met}>{req.label}</span>
                    </div>
                {/each}
                {#if requirementsList.length > 3}
                    <div class="requirement-item more">
                        <Info size={14} color="#94a3b8" />
                        <span>+{requirementsList.length - 3} more requirements</span>
                    </div>
                {/if}
            </div>
        {/if}

        <!-- Integration Mode Badge -->
        <div class="integration-mode">
            <span class="mode-badge">
                {data.integrationMode || "API Connector"}
            </span>
        </div>

        <!-- Quick Actions -->
        {#if data.documentationUrl || data.setupGuideUrl}
            <div class="quick-actions">
                {#if data.setupGuideUrl}
                    <button class="action-link" title="Setup Guide">
                        <ExternalLink size={12} /> Setup Guide
                    </button>
                {/if}
            </div>
        {/if}
    </div>

    <!-- Integration Status Indicator -->
    <div class="status-indicator" class:ready={integrationStatus.ready} class:partial={integrationStatus.percentage > 0 && !integrationStatus.ready}>
        {#if integrationStatus.ready}
            <CheckCircle2 size={16} color="#10b981" />
        {:else if integrationStatus.percentage > 0}
            <AlertCircle size={16} color="#f59e0b" />
        {:else}
            <AlertCircle size={16} color="#ef4444" />
        {/if}
    </div>

    <!-- Marketplace Badge -->
    {#if data.isMarketplace}
        <div class="marketplace-badge">
            <ExternalLink size={10} /> Marketplace
        </div>
    {/if}

    <!-- Connection Handles -->
    <Handle type="target" position={Position.Left} />
    <Handle type="source" position={Position.Right} />
    <Handle type="target" position={Position.Top} />
    <Handle type="source" position={Position.Bottom} />
</div>

<style>
    .vendor-integration-node {
        padding: 14px;
        min-width: 240px;
        max-width: 280px;
        border-radius: 12px;
        border: 1px solid rgba(139, 92, 246, 0.3);
        background: rgba(15, 23, 42, 0.95);
        position: relative;
        transition: all 0.2s;
    }

    .vendor-integration-node.selected {
        border-color: #8b5cf6;
        box-shadow: 0 0 20px rgba(139, 92, 246, 0.3);
    }

    .vendor-integration-node.ready {
        border-color: #10b981;
    }

    .vendor-integration-node.ready.selected {
        box-shadow: 0 0 20px rgba(16, 185, 129, 0.3);
    }

    .node-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 12px;
    }

    .icon-wrapper {
        width: 36px;
        height: 36px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid rgba(139, 92, 246, 0.2);
    }

    .header-text {
        display: flex;
        flex-direction: column;
        flex: 1;
    }

    .vendor-label {
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #94a3b8;
        font-weight: 600;
    }

    .product-name {
        font-size: 14px;
        font-weight: 600;
        color: #f8fafc;
        line-height: 1.2;
    }

    .node-content {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    /* Integration Status */
    .integration-status {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 8px;
        padding: 8px;
    }

    .status-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 6px;
    }

    .status-label {
        font-size: 10px;
        color: #94a3b8;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .status-percentage {
        font-size: 11px;
        font-weight: 700;
        color: #f59e0b;
    }

    .status-percentage.ready {
        color: #10b981;
    }

    .progress-bar {
        width: 100%;
        height: 6px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 3px;
        overflow: hidden;
    }

    .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #f59e0b, #fb923c);
        border-radius: 3px;
        transition: width 0.3s ease;
    }

    .progress-fill.ready {
        background: linear-gradient(90deg, #10b981, #34d399);
    }

    /* Requirements List */
    .requirements-list {
        background: rgba(0, 0, 0, 0.15);
        border-radius: 6px;
        padding: 8px;
    }

    .requirements-header {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 10px;
        color: #94a3b8;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 6px;
    }

    .requirement-item {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 11px;
        color: #cbd5e1;
        margin-bottom: 4px;
        padding: 2px 0;
    }

    .requirement-item:last-child {
        margin-bottom: 0;
    }

    .requirement-item span {
        flex: 1;
        line-height: 1.3;
    }

    .requirement-item span.met {
        color: #10b981;
        font-weight: 500;
    }

    .requirement-item.more {
        color: #64748b;
        font-style: italic;
    }

    /* Integration Mode Badge */
    .integration-mode {
        display: flex;
        justify-content: flex-start;
    }

    .mode-badge {
        display: inline-block;
        background: rgba(139, 92, 246, 0.15);
        color: #a78bfa;
        font-size: 9px;
        padding: 3px 8px;
        border-radius: 4px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        border: 1px solid rgba(139, 92, 246, 0.3);
    }

    /* Quick Actions */
    .quick-actions {
        display: flex;
        gap: 6px;
        padding-top: 4px;
    }

    .action-link {
        display: flex;
        align-items: center;
        gap: 4px;
        background: rgba(139, 92, 246, 0.1);
        border: 1px solid rgba(139, 92, 246, 0.3);
        color: #a78bfa;
        font-size: 10px;
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s;
        font-weight: 500;
    }

    .action-link:hover {
        background: rgba(139, 92, 246, 0.2);
        color: #c4b5fd;
    }

    /* Status Indicator */
    .status-indicator {
        position: absolute;
        top: 10px;
        right: 10px;
        width: 24px;
        height: 24px;
        background: rgba(15, 23, 42, 0.9);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid #ef4444;
    }

    .status-indicator.partial {
        border-color: #f59e0b;
    }

    .status-indicator.ready {
        border-color: #10b981;
        box-shadow: 0 0 12px rgba(16, 185, 129, 0.4);
    }

    /* Marketplace Badge */
    .marketplace-badge {
        position: absolute;
        bottom: 10px;
        right: 10px;
        background: #8b5cf6;
        color: white;
        font-size: 9px;
        padding: 3px 6px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        gap: 3px;
        font-weight: 600;
    }
</style>
