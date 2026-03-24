<script lang="ts">
    import {
        X,
        History,
        User,
        CheckCircle2,
        AlertCircle,
        Clock,
    } from "lucide-svelte";

    let {
        diagramId,
        isOpen = $bindable(),
        onRestore = (version: any) => {},
    } = $props();

    let versions = $state<any[]>([]);
    let isLoading = $state(false);
    let error = $state<string | null>(null);

    $effect(() => {
        if (isOpen && diagramId) {
            loadVersions();
        }
    });

    async function loadVersions() {
        isLoading = true;
        error = null;
        try {
            const res = await fetch(`/api/diagrams/${diagramId}/versions`);
            const data = await res.json();
            if (data.versions) {
                versions = data.versions;
            } else {
                error = data.error || "Failed to load history";
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
                <div class="header-title">
                    <History size={20} color="var(--accent-primary)" />
                    <h3>Version History</h3>
                </div>
                <button class="close-btn" onclick={() => (isOpen = false)}
                    >&times;</button
                >
            </div>

            <div class="modal-body">
                {#if isLoading}
                    <div class="loading">
                        <div class="spinner"></div>
                        Fetching timeline...
                    </div>
                {:else if error}
                    <div class="error-msg">{error}</div>
                {:else if versions.length === 0}
                    <div class="empty-state">
                        <p>No version history available.</p>
                    </div>
                {:else}
                    <div class="version-list">
                        {#each versions as version}
                            <div class="version-item">
                                <div class="version-main">
                                    <div class="version-badge">
                                        v{version.versionNumber}
                                    </div>
                                    <div class="version-details">
                                        <span class="change-summary"
                                            >{version.changeSummary ||
                                                "Manual Save"}</span
                                        >
                                        <div class="meta">
                                            <span class="user"
                                                ><User size={12} />
                                                {version.createdBy.split(
                                                    "-",
                                                )[0]}...</span
                                            >
                                            <span class="time"
                                                ><Clock size={12} />
                                                {new Date(
                                                    version.createdAt,
                                                ).toLocaleString()}</span
                                            >
                                        </div>
                                    </div>
                                </div>

                                <div class="version-footer">
                                    <div class="artifact-status">
                                        <CheckCircle2
                                            size={14}
                                            color="#10b981"
                                        />
                                        <span>Terraform Generated</span>
                                    </div>
                                    <button
                                        class="restore-btn"
                                        onclick={() => {
                                            onRestore(version);
                                            isOpen = false;
                                        }}
                                    >
                                        Restore This Version
                                    </button>
                                </div>
                            </div>
                        {/each}
                    </div>
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
        z-index: 10001;
    }

    .modal-content {
        width: 90%;
        max-width: 500px;
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

    .header-title {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .modal-header h3 {
        margin: 0;
        font-size: 1.1rem;
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
        padding: 0;
        overflow-y: auto;
        flex: 1;
    }

    .version-list {
        display: flex;
        flex-direction: column;
    }

    .version-item {
        padding: 20px 24px;
        border-bottom: 1px solid var(--border-color);
        display: flex;
        flex-direction: column;
        gap: 16px;
        transition: background 0.2s;
    }

    .version-item:hover {
        background: rgba(255, 255, 255, 0.02);
    }

    .version-main {
        display: flex;
        gap: 16px;
        align-items: flex-start;
    }

    .version-badge {
        background: var(--accent-primary);
        color: #fff;
        font-weight: 700;
        font-size: 0.75rem;
        padding: 4px 10px;
        border-radius: 20px;
        white-space: nowrap;
    }

    .version-details {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .change-summary {
        font-weight: 500;
        font-size: 0.95rem;
        color: var(--text-main);
    }

    .meta {
        display: flex;
        gap: 16px;
        font-size: 0.75rem;
        color: var(--text-muted);
    }

    .user,
    .time {
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .version-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .artifact-status {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.75rem;
        color: #10b981;
        font-weight: 500;
    }

    .restore-btn {
        padding: 6px 12px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid var(--border-color);
        border-radius: 6px;
        color: var(--text-main);
        font-size: 0.8rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
    }

    .restore-btn:hover {
        background: var(--accent-primary);
        border-color: var(--accent-primary);
        color: #fff;
    }

    .loading,
    .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 40px;
        color: var(--text-muted);
        gap: 16px;
    }

    .spinner {
        width: 20px;
        height: 20px;
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
