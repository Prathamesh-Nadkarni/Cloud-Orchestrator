<script lang="ts">
    import { X, DollarSign, TrendingUp, ChevronRight } from "lucide-svelte";
    import { fade, slide } from "svelte/transition";

    let { nodes, isOpen = $bindable() } = $props();

    function calculateNodeCost(node: any) {
        let nodeCost = 0;
        if (node.data.type === "compute" || node.data.type === "kubernetes") {
            if (node.data.size?.includes("micro")) nodeCost += 8;
            else if (node.data.size?.includes("small")) nodeCost += 16;
            else if (node.data.size?.includes("medium")) nodeCost += 32;
            else if (node.data.size?.includes("large")) nodeCost += 64;
            else if (node.data.size?.includes("xlarge")) nodeCost += 128;
            else nodeCost += 20;

            if (node.data.type === "kubernetes") {
                nodeCost = nodeCost * (node.data.count || 3);
                nodeCost += 73; // Control plane flat fee
            }
        }

        if (node.data.disk) {
            nodeCost += node.data.disk * 0.1; // $0.10 / GB
        }

        return nodeCost;
    }

    let totalCost = $derived(
        nodes.reduce(
            (acc: number, node: any) => acc + calculateNodeCost(node),
            0,
        ),
    );

    let costItems = $derived(
        nodes
            .map((node: any) => ({
                id: node.id,
                name: node.data.name || node.data.label,
                provider: node.data.provider,
                cost: calculateNodeCost(node),
                type: node.data.type,
            }))
            .filter((item: any) => item.cost > 0)
            .sort((a: any, b: any) => b.cost - a.cost),
    );
</script>

{#if isOpen}
    <div
        class="cost-overlay"
        transition:fade={{ duration: 200 }}
        onclick={() => (isOpen = false)}
        onkeydown={(e) => e.key === "Escape" && (isOpen = false)}
        role="button"
        tabindex="-1"
    >
        <div
            class="cost-panel glass-panel"
            onclick={(e) => e.stopPropagation()}
            onkeydown={(e) => e.stopPropagation()}
            role="none"
            transition:slide={{ axis: "x" }}
        >
            <div class="panel-header">
                <div class="title-area">
                    <DollarSign size={20} class="text-accent" />
                    <h3>Monthly Cost Breakdown</h3>
                </div>
                <button class="close-btn" onclick={() => (isOpen = false)}>
                    <X size={20} />
                </button>
            </div>

            <div class="total-summary">
                <span class="label">Estimated Total Monthly Cost</span>
                <div class="amount-row">
                    <span class="currency">$</span>
                    <span class="amount">{totalCost.toFixed(2)}</span>
                    <TrendingUp size={24} class="trend-icon" />
                </div>
            </div>

            <div class="items-list">
                {#each costItems as item}
                    <div class="cost-item">
                        <div class="item-info">
                            <span class="item-provider badge-{item.provider}"
                                >{item.provider.toUpperCase()}</span
                            >
                            <span class="item-name">{item.name}</span>
                        </div>
                        <div class="item-price">
                            <span class="price-val"
                                >${item.cost.toFixed(2)}</span
                            >
                            <span class="price-freq">/mo</span>
                        </div>
                    </div>
                {:else}
                    <div class="empty-state">
                        <p>
                            No billable resources found in the current
                            architecture.
                        </p>
                    </div>
                {/each}
            </div>

            <div class="panel-footer">
                <p class="disclaimer">
                    * Costs are estimated based on standard on-demand pricing
                    and exclude data transfer, taxes, and specialized managed
                    service fees.
                </p>
            </div>
        </div>
    </div>
{/if}

<style>
    .cost-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(4px);
        z-index: 1000;
        display: flex;
        justify-content: flex-end;
    }

    .cost-panel {
        width: 400px;
        height: 100%;
        background: rgba(15, 17, 21, 0.98);
        display: flex;
        flex-direction: column;
        border-radius: 0;
        border-top: none;
        border-bottom: none;
        border-right: none;
        box-shadow: -10px 0 40px rgba(0, 0, 0, 0.5);
    }

    .panel-header {
        padding: 24px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid var(--border-color);
    }

    .title-area {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .title-area h3 {
        margin: 0;
        font-size: 1.1rem;
        font-weight: 600;
    }

    .text-accent {
        color: var(--accent-primary);
    }

    .close-btn {
        background: transparent;
        border: none;
        color: var(--text-muted);
        cursor: pointer;
        padding: 4px;
        border-radius: 6px;
        transition: all 0.2s;
    }

    .close-btn:hover {
        background: var(--bg-panel-hover);
        color: var(--text-main);
    }

    .total-summary {
        padding: 32px 24px;
        background: rgba(99, 102, 241, 0.05);
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .total-summary .label {
        font-size: 0.85rem;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 1px;
        font-weight: 600;
    }

    .amount-row {
        display: flex;
        align-items: baseline;
        gap: 4px;
        color: var(--text-main);
    }

    .currency {
        font-size: 1.5rem;
        font-weight: 400;
        color: var(--text-muted);
    }

    .amount {
        font-size: 3rem;
        font-weight: 700;
        letter-spacing: -1px;
    }

    .trend-icon {
        margin-left: auto;
        color: #10b981;
    }

    .items-list {
        flex: 1;
        overflow-y: auto;
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .cost-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        transition: all 0.2s;
    }

    .cost-item:hover {
        background: rgba(255, 255, 255, 0.06);
        transform: translateY(-2px);
    }

    .item-info {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .item-name {
        font-size: 0.95rem;
        font-weight: 600;
        color: var(--text-main);
    }

    .item-provider {
        font-size: 0.65rem;
        font-weight: 800;
        padding: 2px 6px;
        border-radius: 4px;
        width: fit-content;
    }

    .badge-aws {
        background: rgba(255, 153, 0, 0.15);
        color: #ff9900;
    }
    .badge-azure {
        background: rgba(0, 137, 214, 0.15);
        color: #0089d6;
    }
    .badge-gcp {
        background: rgba(66, 133, 244, 0.15);
        color: #4285f4;
    }
    .badge-kubernetes {
        background: rgba(50, 108, 230, 0.15);
        color: #326ce6;
    }

    .item-price {
        text-align: right;
        display: flex;
        flex-direction: column;
    }

    .price-val {
        font-size: 1.1rem;
        font-weight: 700;
        color: var(--text-main);
    }

    .price-freq {
        font-size: 0.75rem;
        color: var(--text-muted);
    }

    .empty-state {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: var(--text-muted);
        font-size: 0.9rem;
        text-align: center;
        padding: 40px;
    }

    .panel-footer {
        padding: 20px;
        border-top: 1px solid var(--border-color);
    }

    .disclaimer {
        font-size: 0.7rem;
        color: var(--text-muted);
        line-height: 1.4;
        font-style: italic;
    }
</style>
