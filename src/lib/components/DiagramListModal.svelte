<script lang="ts">
    import { X, Clock, User, Globe, FileJson, Search } from "lucide-svelte";

    let { isOpen = $bindable(), onSelect = (diagram: any) => {} } = $props();

    let diagrams = $state<any[]>([]);
    let searchQuery = $state("");
    let isLoading = $state(false);
    let error = $state<string | null>(null);

    let filteredDiagrams = $derived(
        diagrams.filter(
            (d) =>
                d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                d.owner?.name
                    ?.toLowerCase()
                    .includes(searchQuery.toLowerCase()),
        ),
    );

    $effect(() => {
        if (isOpen) {
            loadDiagrams();
        }
    });

    async function loadDiagrams() {
        isLoading = true;
        error = null;
        try {
            const res = await fetch("/api/diagrams");
            const data = await res.json();
            if (data.diagrams) {
                diagrams = data.diagrams;
            } else {
                error = data.error || "Failed to load diagrams";
            }
        } catch (err) {
            error = "Network error";
        } finally {
            isLoading = false;
        }
    }
</script>

{#if isOpen}
    <div class="modal-backdrop" onclick={() => (isOpen = false)}>
        <div
            class="modal-content glass-panel"
            onclick={(e) => e.stopPropagation()}
        >
            <div class="modal-header">
                <h3>Saved Diagrams</h3>
                <button class="close-btn" onclick={() => (isOpen = false)}
                    >&times;</button
                >
            </div>

            <div class="modal-body">
                <div class="search-container">
                    <Search size={18} class="search-icon" />
                    <input
                        type="text"
                        placeholder="Search diagrams by name or owner..."
                        bind:value={searchQuery}
                    />
                </div>

                {#if isLoading}
                    <div class="loading">
                        <div class="spinner"></div>
                        Loading your designs...
                    </div>
                {:else if error}
                    <div class="error-msg">{error}</div>
                {:else if diagrams.length === 0}
                    <div class="empty-state">
                        <Globe size={48} opacity="0.2" />
                        <p>No diagrams saved yet.</p>
                    </div>
                {:else}
                    <div class="diagram-grid">
                        {#each filteredDiagrams as diagram}
                            <button
                                class="diagram-card"
                                onclick={() => {
                                    onSelect(diagram);
                                    isOpen = false;
                                }}
                            >
                                <div class="card-header">
                                    <span class="diagram-name"
                                        >{diagram.name}</span
                                    >
                                    <span
                                        class="status-badge"
                                        class:published={diagram.status ===
                                            "PUBLISHED"}
                                    >
                                        {diagram.status}
                                    </span>
                                </div>

                                <div class="card-meta">
                                    <div class="meta-item">
                                        <User size={14} />
                                        <span
                                            >{diagram.owner?.name ||
                                                "Unknown"}</span
                                        >
                                    </div>

                                    <div class="meta-item">
                                        <Clock size={14} />
                                        <span
                                            >{new Date(
                                                diagram.updatedAt,
                                            ).toLocaleDateString()}</span
                                        >
                                    </div>
                                </div>

                                <div class="provider-tray">
                                    {#each diagram.providers as provider}
                                        <span
                                            class="provider-icon icon-{provider}"
                                            >{provider}</span
                                        >
                                    {/each}
                                </div>
                            </button>
                        {/each}
                    </div>

                    {#if filteredDiagrams.length === 0 && !isLoading}
                        <div class="empty-results">
                            <Search size={48} opacity="0.2" />
                            <p>No diagrams match "{searchQuery}"</p>
                        </div>
                    {/if}
                {/if}
            </div>
        </div>
    </div>
{/if}

<style>
    .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    }

    .modal-content {
        width: 90%;
        max-width: 800px;
        max-height: 80vh;
        background: var(--bg-panel);
        border: 1px solid var(--border-color);
        border-radius: 12px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        box-shadow: 0 24px 48px rgba(0, 0, 0, 0.5);
    }

    .modal-header {
        padding: 20px 24px;
        border-bottom: 1px solid var(--border-color);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .modal-header h3 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
    }

    .close-btn {
        background: none;
        border: none;
        color: var(--text-muted);
        font-size: 1.5rem;
        cursor: pointer;
    }

    .modal-body {
        padding: 24px;
        overflow-y: auto;
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 20px;
    }

    .search-container {
        position: relative;
        display: flex;
        align-items: center;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        padding: 0 16px;
        transition: all 0.2s;
    }

    .search-container:focus-within {
        border-color: var(--accent-primary);
        background: rgba(255, 255, 255, 0.05);
    }

    .search-icon {
        color: var(--text-muted);
    }

    .search-container input {
        background: none;
        border: none;
        color: var(--text-main);
        padding: 12px;
        flex: 1;
        outline: none;
        font-size: 0.9rem;
    }

    .diagram-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 16px;
    }

    .diagram-card {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        padding: 16px;
        text-align: left;
        transition: all 0.2s;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .diagram-card:hover {
        background: rgba(255, 255, 255, 0.08);
        border-color: var(--accent-primary);
        transform: translateY(-2px);
    }

    .diagram-name {
        font-weight: 600;
        font-size: 1rem;
        color: var(--text-main);
        display: block;
        margin-bottom: 4px;
    }

    .status-badge {
        font-size: 0.7rem;
        font-weight: 700;
        padding: 2px 6px;
        border-radius: 4px;
        background: rgba(255, 255, 255, 0.1);
        color: var(--text-muted);
        text-transform: uppercase;
    }

    .status-badge.published {
        background: rgba(16, 185, 129, 0.2);
        color: #10b981;
    }

    .card-meta {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .meta-item {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.75rem;
        color: var(--text-muted);
    }

    .provider-tray {
        display: flex;
        gap: 6px;
        margin-top: auto;
    }

    .provider-icon {
        font-size: 0.6rem;
        font-weight: 800;
        padding: 2px 6px;
        border-radius: 4px;
        text-transform: uppercase;
        background: rgba(0, 0, 0, 0.3);
    }

    .icon-aws {
        color: #ff9900;
    }
    .icon-azure {
        color: #0089d6;
    }
    .icon-gcp {
        color: #4285f4;
    }

    .loading,
    .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 60px;
        color: var(--text-muted);
        gap: 16px;
    }

    .spinner {
        width: 24px;
        height: 24px;
        border: 2px solid rgba(255, 255, 255, 0.1);
        border-top-color: var(--accent-primary);
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }
</style>
