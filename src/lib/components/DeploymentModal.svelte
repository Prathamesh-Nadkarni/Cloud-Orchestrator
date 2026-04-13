<script lang="ts">
    import {
        X,
        Terminal,
        Play,
        Eye,
        Trash2,
        CheckCircle2,
        XCircle,
        Loader2,
        Clock,
        User,
    } from "lucide-svelte";
    import { onMount, onDestroy } from "svelte";

    let { isOpen = $bindable(false), diagramId, currentVersionId } = $props();

    let runs = $state<any[]>([]);
    let selectedRun = $state<any>(null);
    let isLoading = $state(false);
    let pollInterval: any;

    async function fetchHistory() {
        if (!diagramId) return;
        try {
            const res = await fetch(`/api/diagrams/${diagramId}/deploy`);
            const data = await res.json();
            if (data.success) {
                runs = data.runs;
            }
        } catch (err) {
            console.error("Failed to fetch history");
        }
    }

    async function startRun(type: "PLAN" | "APPLY" | "DESTROY") {
        if (!diagramId || !currentVersionId) {
            alert("Cannot start run: Diagram not saved or version unknown.");
            return;
        }

        isLoading = true;
        try {
            const res = await fetch(`/api/diagrams/${diagramId}/deploy`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ versionId: currentVersionId, type }),
            });
            const data = await res.json();
            if (data.success) {
                selectedRun = data.run;
                fetchHistory();
            } else {
                alert("Failed to start run: " + data.error);
            }
        } catch (err) {
            alert("Network error.");
        } finally {
            isLoading = false;
        }
    }

    async function refreshSelectedRun() {
        if (!selectedRun) return;
        try {
            const res = await fetch(`/api/deploy/runs/${selectedRun.id}`);
            const data = await res.json();
            if (data.success) {
                selectedRun = data.run;
                // Update in list too
                runs = runs.map((r) =>
                    r.id === selectedRun.id
                        ? { ...r, status: data.run.status }
                        : r,
                );
            }
        } catch (err) {
            console.error("Polling error");
        }
    }

    $effect(() => {
        if (isOpen) {
            fetchHistory();
            pollInterval = setInterval(() => {
                if (
                    selectedRun &&
                    selectedRun.status !== "COMPLETED" &&
                    selectedRun.status !== "FAILED"
                ) {
                    refreshSelectedRun();
                } else {
                    fetchHistory();
                }
            }, 3000);
        } else {
            clearInterval(pollInterval);
        }
    });

    onDestroy(() => clearInterval(pollInterval));

    function formatDate(d: string) {
        return new Date(d).toLocaleString();
    }
</script>

{#if isOpen}
    <div class="modal-overlay" onclick={() => (isOpen = false)}>
        <div class="modal-content" onclick={(e) => e.stopPropagation()}>
            <div class="header">
                <div class="title-area">
                    <Terminal size={20} color="var(--accent-avx)" />
                    <h2>Infrastructure Lifecycle</h2>
                </div>
                <button class="close-btn" onclick={() => (isOpen = false)}>
                    <X size={20} />
                </button>
            </div>

            <div class="actions-bar">
                <button
                    class="run-btn plan"
                    onclick={() => startRun("PLAN")}
                    disabled={isLoading}
                >
                    <Eye size={16} /> Plan
                </button>
                <button
                    class="run-btn apply"
                    onclick={() => startRun("APPLY")}
                    disabled={isLoading}
                >
                    <Play size={16} /> Apply
                </button>
                <button
                    class="run-btn destroy"
                    onclick={() => startRun("DESTROY")}
                    disabled={isLoading}
                >
                    <Trash2 size={16} /> Destroy
                </button>
            </div>

            <div class="main-split">
                <div class="history-sidebar">
                    <h3>Run History</h3>
                    <div class="run-list">
                        {#each runs as run}
                            <button
                                class="run-item"
                                class:active={selectedRun?.id === run.id}
                                onclick={() => (selectedRun = run)}
                            >
                                <div class="run-info">
                                    <span
                                        class="run-type {run.type.toLowerCase()}"
                                        >{run.type}</span
                                    >
                                    <span class="run-date"
                                        >{formatDate(run.createdAt)}</span
                                    >
                                </div>
                                <div class="run-meta">
                                    <span
                                        class="status-tag {run.status.toLowerCase()}"
                                    >
                                        {run.status}
                                    </span>
                                    <span class="user-info">
                                        <User size={10} />
                                        {run.user?.name || "User"}
                                    </span>
                                </div>
                            </button>
                        {/each}
                        {#if runs.length === 0}
                            <div class="empty-state">
                                No deployment runs found.
                            </div>
                        {/if}
                    </div>
                </div>

                <div class="log-viewer">
                    {#if selectedRun}
                        <div class="log-header">
                            <span class="log-title"
                                >Execution Log: {selectedRun.id}</span
                            >
                            <span
                                class="status-pill {selectedRun.status.toLowerCase()}"
                            >
                                {#if selectedRun.status === "RUNNING"}<Loader2
                                        size={12}
                                        class="spin"
                                    />{/if}
                                {selectedRun.status}
                            </span>
                        </div>
                        <pre class="terminal-output">{selectedRun.logs}</pre>
                    {:else}
                        <div class="log-placeholder">
                            <Terminal
                                size={48}
                                color="rgba(255,255,255,0.05)"
                            />
                            <p>Select a run to view execution logs</p>
                        </div>
                    {/if}
                </div>
            </div>
        </div>
    </div>
{/if}

<style>
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.85);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        backdrop-filter: blur(8px);
    }

    .modal-content {
        background: #0f1115;
        width: 90vw;
        height: 85vh;
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
    }

    .header {
        padding: 20px 24px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .title-area {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .title-area h2 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: white;
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
        background: rgba(255, 255, 255, 0.05);
        color: white;
    }

    .actions-bar {
        padding: 16px 24px;
        background: rgba(255, 255, 255, 0.02);
        display: flex;
        gap: 12px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .run-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 0.85rem;
        font-weight: 600;
        cursor: pointer;
        border: 1px solid transparent;
        transition: all 0.2s;
    }

    .run-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .run-btn.plan {
        background: rgba(59, 130, 246, 0.1);
        color: #60a5fa;
        border-color: rgba(59, 130, 246, 0.2);
    }
    .run-btn.apply {
        background: rgba(16, 185, 129, 0.1);
        color: #34d399;
        border-color: rgba(16, 185, 129, 0.2);
    }
    .run-btn.destroy {
        background: rgba(239, 68, 68, 0.1);
        color: #f87171;
        border-color: rgba(239, 68, 68, 0.2);
    }

    .main-split {
        flex: 1;
        display: flex;
        overflow: hidden;
    }

    .history-sidebar {
        width: 320px;
        border-right: 1px solid rgba(255, 255, 255, 0.05);
        display: flex;
        flex-direction: column;
        background: rgba(0, 0, 0, 0.2);
    }

    .history-sidebar h3 {
        padding: 16px 20px;
        margin: 0;
        font-size: 0.85rem;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .run-list {
        flex: 1;
        overflow-y: auto;
        padding: 0 12px 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .run-item {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 8px;
        padding: 12px;
        text-align: left;
        cursor: pointer;
        transition: all 0.2s;
    }

    .run-item:hover {
        background: rgba(255, 255, 255, 0.06);
    }
    .run-item.active {
        border-color: var(--accent-avx);
        background: rgba(139, 92, 246, 0.05);
    }

    .run-info {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
    }

    .run-type {
        font-size: 0.7rem;
        font-weight: 800;
        padding: 2px 6px;
        border-radius: 4px;
        text-transform: uppercase;
    }

    .run-type.plan {
        background: #1e3a8a;
        color: #93c5fd;
    }
    .run-type.apply {
        background: #064e3b;
        color: #6ee7b7;
    }
    .run-type.destroy {
        background: #7f1d1d;
        color: #fca5a5;
    }

    .run-date {
        font-size: 0.7rem;
        color: var(--text-muted);
    }

    .run-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .status-tag {
        font-size: 0.7rem;
        font-weight: 600;
        text-transform: capitalize;
    }

    .status-tag.completed {
        color: #10b981;
    }
    .status-tag.failed {
        color: #ef4444;
    }
    .status-tag.running {
        color: #3b82f6;
    }
    .status-tag.queued {
        color: #f59e0b;
    }

    .user-info {
        font-size: 0.65rem;
        color: var(--text-muted);
        display: flex;
        align-items: center;
        gap: 4px;
    }

    .log-viewer {
        flex: 1;
        display: flex;
        flex-direction: column;
        background: #000;
    }

    .log-header {
        padding: 12px 20px;
        background: #111;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .log-title {
        font-family: "JetBrains Mono", monospace;
        font-size: 0.75rem;
        color: var(--text-muted);
    }

    .status-pill {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.7rem;
        font-weight: 700;
        text-transform: uppercase;
    }

    .terminal-output {
        flex: 1;
        margin: 0;
        padding: 20px;
        font-family: "JetBrains Mono", "Fira Code", monospace;
        font-size: 13px;
        line-height: 1.6;
        color: #e0e0e0;
        overflow-y: auto;
        white-space: pre-wrap;
    }

    .log-placeholder {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        color: var(--text-muted);
        opacity: 0.5;
    }

    .spin {
        animation: spin 1s linear infinite;
    }
    @keyframes spin {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }

    .empty-state {
        padding: 40px 20px;
        text-align: center;
        color: var(--text-muted);
        font-size: 0.85rem;
        font-style: italic;
    }
</style>
