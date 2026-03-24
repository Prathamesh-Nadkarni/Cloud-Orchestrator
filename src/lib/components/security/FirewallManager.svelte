<script lang="ts">
    import {
        Shield,
        Plus,
        Trash2,
        ChevronDown,
        ChevronUp,
        AlertTriangle,
        CheckCircle,
        Info,
        ArrowDown,
        MoreVertical,
        Settings2,
        Zap,
    } from "lucide-svelte";
    import { onMount } from "svelte";
    import { fade, slide, fly } from "svelte/transition";

    let { diagramId, isOpen = $bindable(), onClose } = $props();

    let rules: any[] = $state([]);
    let sortedRules: any[] = $state([]);
    let validation: any = $state({});
    let loading = $state(true);
    let activeTab = $state("rules"); // 'rules' | 'topology' | 'analytics'

    onMount(async () => {
        await loadPolicy();
    });

    async function loadPolicy() {
        loading = true;
        try {
            const res = await fetch(`/api/security/policies/${diagramId}`);
            const data = await res.json();
            rules = data.policy.rules;
            sortedRules = data.sortedRules;
            validation = data.validation;
        } catch (e) {
            console.error(e);
        } finally {
            loading = false;
        }
    }

    async function addRule() {
        const newRule = {
            name: "New Security Rule",
            priority: suggestedPriority(),
            layer: "NETWORK",
            action: "ALLOW",
            protocol: "TCP",
            ports: [],
            srcMatch: { values: ["ANY"] },
            dstMatch: { values: ["ANY"] },
            isWildcard: false,
        };

        try {
            const res = await fetch(
                `/api/security/policies/${diagramId}/rules`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(newRule),
                },
            );
            if (res.ok) await loadPolicy();
        } catch (e) {
            console.error(e);
        }
    }

    function suggestedPriority() {
        const max = Math.max(0, ...rules.map((r) => r.priority));
        return Math.floor((max + 100) / 100) * 100;
    }

    function getActionColor(action: string) {
        switch (action) {
            case "ALLOW":
                return "#10b981";
            case "DENY":
                return "#ef4444";
            case "CHALLENGE":
                return "#f59e0b";
            case "QUARANTINE":
                return "#7c3aed";
            case "RATE_LIMIT":
                return "#3b82f6";
            default:
                return "#64748b";
        }
    }

    function getLayerColor(layer: string) {
        switch (layer) {
            case "DNAT":
                return "#ec4899";
            case "WAF":
                return "#8b5cf6";
            case "NETWORK":
                return "#3b82f6";
            case "APPLICATION":
                return "#14b8a6";
            default:
                return "#94a3b8";
        }
    }
</script>

{#if isOpen}
    <div class="firewall-manager-overlay" onclick={onClose}>
        <div
            class="firewall-panel glass-panel"
            onclick={(e) => e.stopPropagation()}
            in:fly={{ y: 20, duration: 300 }}
        >
            <header class="panel-header">
                <div class="header-main">
                    <div class="title-group">
                        <Shield class="header-icon" />
                        <h1>Distributed Cloud Firewall</h1>
                        <span class="badge">BETA</span>
                    </div>
                    <p class="subtitle">
                        Provider-agnostic security policy & priority evaluation
                        engine
                    </p>
                </div>
                <div class="header-actions">
                    <button class="icon-btn" onclick={onClose}>&times;</button>
                </div>
            </header>

            <nav class="tabs">
                <button
                    class:active={activeTab === "rules"}
                    onclick={() => (activeTab = "rules")}
                >
                    Security Rules
                </button>
                <button
                    class:active={activeTab === "topology"}
                    onclick={() => (activeTab = "topology")}
                >
                    Effective Topology
                </button>
            </nav>

            <main class="panel-body">
                {#if loading}
                    <div class="loading-state">
                        <Zap class="spin" />
                        <span>Calculating effective rule order...</span>
                    </div>
                {:else}
                    <div class="toolbar">
                        <div class="search-box">
                            <input
                                type="text"
                                placeholder="Filter rules by name, provider, or identity..."
                            />
                        </div>
                        <button class="primary-btn" onclick={addRule}>
                            <Plus size={16} /> New Rule
                        </button>
                    </div>

                    <div class="rules-table-container">
                        <table class="rules-table">
                            <thead>
                                <tr>
                                    <th style="width: 40px">Order</th>
                                    <th>Rule Name</th>
                                    <th style="width: 100px">Layer</th>
                                    <th style="width: 100px">Priority</th>
                                    <th style="width: 100px">Action</th>
                                    <th>Match (Source → Destination)</th>
                                    <th style="width: 120px">Validation</th>
                                    <th style="width: 40px"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {#each sortedRules as rule, index}
                                    {@const val = validation[rule.id]}
                                    <tr
                                        class="rule-row"
                                        class:shadowed={val?.shadowedBy}
                                        class:wildcard={rule.isWildcard}
                                    >
                                        <td class="eval-order">
                                            <span class="order-num"
                                                >{index + 1}</span
                                            >
                                        </td>
                                        <td>
                                            <div class="rule-name-cell">
                                                <span class="rule-name"
                                                    >{rule.name}</span
                                                >
                                                {#if rule.isWildcard}
                                                    <span class="mini-badge"
                                                        >CATCH-ALL</span
                                                    >
                                                {/if}
                                            </div>
                                        </td>
                                        <td>
                                            <span
                                                class="layer-tag"
                                                style="--layer-color: {getLayerColor(
                                                    rule.layer,
                                                )}"
                                            >
                                                {rule.layer}
                                            </span>
                                        </td>
                                        <td>
                                            <div class="priority-cell">
                                                <span class="priority-val"
                                                    >{rule.priority}</span
                                                >
                                                <Settings2
                                                    size={12}
                                                    class="edit-hint"
                                                />
                                            </div>
                                        </td>
                                        <td>
                                            <span
                                                class="action-tag"
                                                style="--action-color: {getActionColor(
                                                    rule.action,
                                                )}"
                                            >
                                                {rule.action}
                                            </span>
                                        </td>
                                        <td>
                                            <div class="match-flow">
                                                <span class="match-part"
                                                    >{rule.srcMatch.values.join(
                                                        ", ",
                                                    )}</span
                                                >
                                                <ArrowDown
                                                    size={12}
                                                    class="flow-arrow"
                                                />
                                                <span class="match-part"
                                                    >{rule.dstMatch.values.join(
                                                        ", ",
                                                    )}</span
                                                >
                                            </div>
                                        </td>
                                        <td>
                                            <div class="validation-status">
                                                {#if val?.warnings?.length > 0}
                                                    <div
                                                        class="val-item warning"
                                                        title={val.warnings.join(
                                                            "\n",
                                                        )}
                                                    >
                                                        <AlertTriangle
                                                            size={14}
                                                        />
                                                        <span
                                                            >{val.shadowedBy
                                                                ? "Shadowed"
                                                                : "Warning"}</span
                                                        >
                                                    </div>
                                                {:else if val?.errors?.length > 0}
                                                    <div
                                                        class="val-item error"
                                                        title={val.errors.join(
                                                            "\n",
                                                        )}
                                                    >
                                                        <AlertTriangle
                                                            size={14}
                                                        />
                                                        <span>Error</span>
                                                    </div>
                                                {:else}
                                                    <div
                                                        class="val-item success"
                                                    >
                                                        <CheckCircle
                                                            size={14}
                                                        />
                                                        <span>Optimal</span>
                                                    </div>
                                                {/if}
                                            </div>
                                        </td>
                                        <td>
                                            <button class="icon-btn-sm"
                                                ><MoreVertical
                                                    size={14}
                                                /></button
                                            >
                                        </td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>

                    <aside class="explainability-pane">
                        <div class="pane-header">
                            <Info size={16} />
                            <h3>Why is this order effective?</h3>
                        </div>
                        <ul class="logic-list">
                            <li>
                                Rules are first grouped by <strong
                                    >Layer Precedence</strong
                                > (DNAT > WAF > Network).
                            </li>
                            <li>
                                Within layers, <strong
                                    >explicit numeric priorities</strong
                                > are evaluated (Lower first).
                            </li>
                            <li>
                                Catch-all / <strong>Wildcard</strong> rules are intentionally
                                demoted to the end of the sequence.
                            </li>
                            <li>
                                Ties are resolved by <strong
                                    >Specificity Scoring</strong
                                > (Exact IPs > Tags > CIDRs).
                            </li>
                        </ul>
                    </aside>
                {/if}
            </main>
        </div>
    </div>
{/if}

<style>
    .firewall-manager-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(12px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2000;
        padding: 40px;
    }

    .firewall-panel {
        width: 1280px;
        max-width: 95vw;
        height: 800px;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 40px 100px rgba(0, 0, 0, 0.5);
    }

    .panel-header {
        padding: 24px 32px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        background: linear-gradient(
            to right,
            rgba(139, 92, 246, 0.05),
            transparent
        );
    }

    .title-group {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 4px;
    }

    .header-icon {
        color: #8b5cf6;
    }

    .panel-header h1 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 700;
        color: white;
    }

    .badge {
        font-size: 10px;
        background: #8b5cf6;
        color: white;
        padding: 2px 6px;
        border-radius: 4px;
        font-weight: 800;
    }

    .subtitle {
        color: #94a3b8;
        font-size: 0.9rem;
        margin: 0;
    }

    .tabs {
        display: flex;
        padding: 0 32px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        background: rgba(0, 0, 0, 0.2);
    }

    .tabs button {
        padding: 16px 24px;
        background: transparent;
        border: none;
        color: #64748b;
        font-size: 0.9rem;
        font-weight: 600;
        cursor: pointer;
        border-bottom: 2px solid transparent;
        transition: all 0.2s;
    }

    .tabs button.active {
        color: white;
        border-bottom-color: #8b5cf6;
    }

    .panel-body {
        flex: 1;
        display: grid;
        grid-template-columns: 1fr 300px;
        overflow: hidden;
    }

    .toolbar {
        grid-column: 1 / 3;
        padding: 16px 32px;
        display: flex;
        justify-content: space-between;
        gap: 20px;
        background: rgba(255, 255, 255, 0.02);
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .search-box {
        flex: 1;
        max-width: 400px;
    }

    .search-box input {
        width: 100%;
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        padding: 8px 16px;
        color: white;
        font-size: 0.85rem;
    }

    .rules-table-container {
        overflow-y: auto;
        padding: 0 32px 32px;
    }

    .rules-table {
        width: 100%;
        border-collapse: collapse;
        text-align: left;
    }

    .rules-table th {
        padding: 16px 12px;
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        color: #64748b;
        position: sticky;
        top: 0;
        background: var(--bg-panel);
        z-index: 10;
    }

    .rule-row {
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        transition: background 0.2s;
    }

    .rule-row:hover {
        background: rgba(255, 255, 255, 0.02);
    }

    .rule-row.shadowed {
        opacity: 0.5;
        background: rgba(239, 68, 68, 0.03);
    }

    .rule-row.wildcard {
        background: rgba(30, 41, 59, 0.3);
    }

    .rule-row td {
        padding: 16px 12px;
        font-size: 0.9rem;
        color: #cbd5e1;
    }

    .eval-order {
        display: flex;
        justify-content: center;
    }

    .order-num {
        background: rgba(255, 255, 255, 0.05);
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 700;
        color: #94a3b8;
    }

    .rule-name-cell {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .rule-name {
        font-weight: 600;
        color: white;
    }

    .mini-badge {
        font-size: 9px;
        background: rgba(148, 163, 184, 0.2);
        color: #94a3b8;
        padding: 1px 4px;
        border-radius: 3px;
        width: fit-content;
    }

    .layer-tag,
    .action-tag {
        font-size: 0.75rem;
        font-weight: 700;
        padding: 4px 8px;
        border-radius: 4px;
        background: color-mix(
            in srgb,
            var(--layer-color, var(--action-color)),
            transparent 90%
        );
        color: var(--layer-color, var(--action-color));
        border: 1px solid
            color-mix(
                in srgb,
                var(--layer-color, var(--action-color)),
                transparent 70%
            );
    }

    .priority-cell {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .edit-hint {
        color: #475569;
        opacity: 0;
        transition: opacity 0.2s;
    }

    .rule-row:hover .edit-hint {
        opacity: 1;
    }

    .match-flow {
        display: flex;
        align-items: center;
        gap: 8px;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
            monospace;
        font-size: 0.8rem;
    }

    .match-part {
        background: rgba(0, 0, 0, 0.2);
        padding: 4px 8px;
        border-radius: 4px;
        color: #94a3b8;
    }

    .flow-arrow {
        color: #475569;
    }

    .validation-status {
        display: flex;
        align-items: center;
    }

    .val-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.8rem;
        font-weight: 600;
    }

    .val-item.success {
        color: #10b981;
    }
    .val-item.warning {
        color: #f59e0b;
    }
    .val-item.error {
        color: #ef4444;
    }

    .explainability-pane {
        background: rgba(15, 23, 42, 0.5);
        border-left: 1px solid rgba(255, 255, 255, 0.05);
        padding: 24px;
        display: flex;
        flex-direction: column;
        gap: 20px;
    }

    .pane-header {
        display: flex;
        align-items: center;
        gap: 10px;
        color: #8b5cf6;
    }

    .pane-header h3 {
        margin: 0;
        font-size: 0.9rem;
        font-weight: 600;
        color: white;
    }

    .logic-list {
        margin: 0;
        padding: 0;
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .logic-list li {
        font-size: 0.85rem;
        color: #94a3b8;
        line-height: 1.5;
        position: relative;
        padding-left: 20px;
    }

    .logic-list li::before {
        content: "•";
        position: absolute;
        left: 0;
        color: #8b5cf6;
        font-weight: bold;
    }

    .loading-state {
        grid-column: 1 / 3;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 16px;
        color: #64748b;
    }

    .spin {
        animation: spin 2s linear infinite;
    }
    @keyframes spin {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }

    .primary-btn {
        background: #8b5cf6;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 8px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        transition: background 0.2s;
    }

    .primary-btn:hover {
        background: #7c3aed;
    }
</style>
