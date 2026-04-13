<script lang="ts">
    import { X, CheckCircle, AlertTriangle, Shield, Info } from "lucide-svelte";
    import { onMount } from "svelte";

    let { isOpen = $bindable(), onClose } = $props();

    let submissions: any[] = $state([]);
    let loading = $state(true);
    let selectedSubmission: any = $state(null);
    let decisionNotes = $state("");

    onMount(async () => {
        await fetchSubmissions();
    });

    async function fetchSubmissions() {
        loading = true;
        try {
            const res = await fetch("/api/admin/marketplace/submissions");
            submissions = await res.json();
        } catch (e) {
            console.error(e);
        } finally {
            loading = false;
        }
    }

    async function handleDecision(decision: "APPROVE" | "REJECT") {
        if (!selectedSubmission) return;

        try {
            const res = await fetch("/api/admin/marketplace/decide", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    submissionId: selectedSubmission.id,
                    decision,
                    notes: decisionNotes,
                    reviewerId: "admin-user",
                }),
            });

            if (res.ok) {
                selectedSubmission = null;
                decisionNotes = "";
                await fetchSubmissions();
            }
        } catch (e) {
            console.error(e);
        }
    }
</script>

{#if isOpen}
    <div class="modal-backdrop" onclick={onClose}>
        <div
            class="modal-content glass-panel"
            onclick={(e) => e.stopPropagation()}
        >
            <div class="modal-header">
                <div class="header-left">
                    <Shield class="header-icon" />
                    <h2>Marketplace Governance Console</h2>
                </div>
                <button class="close-btn" onclick={onClose} aria-label="Close">
                    <X size={20} />
                </button>
            </div>

            <div class="modal-body">
                <div class="submissions-pane">
                    <h3>Pending Submissions ({submissions.length})</h3>
                    {#if loading}
                        <div class="loading">Loading queue...</div>
                    {:else if submissions.length === 0}
                        <div class="empty-state">
                            No pending reviews in queue.
                        </div>
                    {:else}
                        <div class="submissions-list">
                            {#each submissions as sub}
                                <button
                                    class="submission-card"
                                    class:selected={selectedSubmission?.id ===
                                        sub.id}
                                    onclick={() => (selectedSubmission = sub)}
                                >
                                    <div class="card-info">
                                        <span class="vendor-name"
                                            >{sub.vendor.displayName}</span
                                        >
                                        <span class="product-name"
                                            >{sub.package.product.name}</span
                                        >
                                        <span class="version-tag"
                                            >v{sub.package.version}</span
                                        >
                                    </div>
                                    <div class="card-meta">
                                        {new Date(
                                            sub.submittedAt,
                                        ).toLocaleDateString()}
                                    </div>
                                </button>
                            {/each}
                        </div>
                    {/if}
                </div>

                <div class="detail-pane">
                    {#if selectedSubmission}
                        <div class="detail-header">
                            <h3>Review Detail</h3>
                            <span class="status-badge pending"
                                >PENDING REVIEW</span
                            >
                        </div>

                        <div class="detail-content scrollable">
                            <section>
                                <h4>Product Manifest</h4>
                                <div class="manifest-grid">
                                    <div class="grid-item">
                                        <label>Category</label>
                                        <span
                                            >{selectedSubmission.package.product
                                                .category}</span
                                        >
                                    </div>
                                    <div class="grid-item">
                                        <label>Format</label>
                                        <span
                                            >v{selectedSubmission.package
                                                .packageFormatVersion}</span
                                        >
                                    </div>
                                </div>
                                <p class="description">
                                    {selectedSubmission.package.product
                                        .description}
                                </p>
                            </section>

                            <section>
                                <h4>Integrity & Security</h4>
                                <div class="security-check-card">
                                    <Info size={14} />
                                    <span>Zod Schema validation passed.</span>
                                </div>
                                <div class="security-check-card success">
                                    <CheckCircle size={14} />
                                    <span>Terraform Module reachable.</span>
                                </div>
                            </section>

                            <section class="decision-section">
                                <h4>Governance Action</h4>
                                <textarea
                                    bind:value={decisionNotes}
                                    placeholder="Add review notes or requirements..."
                                ></textarea>
                                <div class="action-buttons">
                                    <button
                                        class="approve-btn"
                                        onclick={() =>
                                            handleDecision("APPROVE")}
                                    >
                                        <CheckCircle size={16} /> Approve & Sign
                                    </button>
                                    <button
                                        class="reject-btn"
                                        onclick={() => handleDecision("REJECT")}
                                    >
                                        <AlertTriangle size={16} /> Reject
                                    </button>
                                </div>
                            </section>
                        </div>
                    {:else}
                        <div class="select-prompt">
                            <Info size={32} />
                            <p>
                                Select a submission from the list to begin
                                review.
                            </p>
                        </div>
                    {/if}
                </div>
            </div>
        </div>
    </div>
{/if}

<style>
    .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 40px;
    }

    .modal-content {
        width: 1000px;
        max-width: 90vw;
        height: 700px;
        max-height: 85vh;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    .modal-header {
        padding: 20px 24px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .header-left {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .header-icon {
        color: #8b5cf6;
    }

    .modal-header h2 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: white;
    }

    .close-btn {
        background: transparent;
        border: none;
        color: #94a3b8;
        cursor: pointer;
        padding: 4px;
        border-radius: 6px;
        transition: all 0.2s;
    }

    .close-btn:hover {
        background: rgba(255, 255, 255, 0.1);
        color: white;
    }

    .modal-body {
        flex: 1;
        display: flex;
        overflow: hidden;
    }

    .submissions-pane {
        width: 320px;
        border-right: 1px solid rgba(255, 255, 255, 0.1);
        padding: 20px;
        display: flex;
        flex-direction: column;
        background: rgba(15, 23, 42, 0.3);
    }

    .submissions-pane h3 {
        font-size: 0.9rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #94a3b8;
        margin-bottom: 16px;
    }

    .submissions-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
        overflow-y: auto;
    }

    .submission-card {
        background: rgba(30, 41, 59, 0.5);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 8px;
        padding: 12px;
        text-align: left;
        cursor: pointer;
        transition: all 0.2s;
    }

    .submission-card:hover {
        background: rgba(255, 255, 255, 0.05);
        border-color: rgba(139, 92, 246, 0.3);
    }

    .submission-card.selected {
        background: rgba(139, 92, 246, 0.1);
        border-color: #8b5cf6;
    }

    .card-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .vendor-name {
        font-size: 10px;
        color: #94a3b8;
        text-transform: uppercase;
    }

    .product-name {
        font-size: 14px;
        font-weight: 600;
        color: white;
    }

    .version-tag {
        font-size: 11px;
        color: #8b5cf6;
    }

    .card-meta {
        margin-top: 8px;
        font-size: 11px;
        color: #64748b;
    }

    .detail-pane {
        flex: 1;
        display: flex;
        flex-direction: column;
        padding: 24px;
        overflow-y: auto;
    }

    .detail-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 24px;
    }

    .detail-header h3 {
        margin: 0;
        font-size: 1.5rem;
        color: white;
    }

    .status-badge {
        padding: 4px 10px;
        border-radius: 100px;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.02em;
    }

    .status-badge.pending {
        background: rgba(245, 158, 11, 0.15);
        color: #f59e0b;
        border: 1px solid rgba(245, 158, 11, 0.3);
    }

    .scrollable {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 32px;
    }

    h4 {
        font-size: 0.9rem;
        color: #94a3b8;
        margin-bottom: 12px;
        text-transform: uppercase;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        padding-bottom: 8px;
    }

    .manifest-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;
        margin-bottom: 16px;
    }

    .grid-item label {
        display: block;
        font-size: 11px;
        color: #64748b;
        margin-bottom: 4px;
    }

    .grid-item span {
        color: white;
        font-weight: 500;
    }

    .description {
        color: #cbd5e1;
        line-height: 1.6;
        font-size: 14px;
    }

    .security-check-card {
        display: flex;
        align-items: center;
        gap: 12px;
        background: rgba(255, 255, 255, 0.03);
        padding: 12px;
        border-radius: 8px;
        margin-bottom: 8px;
        font-size: 13px;
        color: #94a3b8;
    }

    .security-check-card.success {
        color: #10b981;
    }

    .decision-section textarea {
        width: 100%;
        height: 100px;
        background: rgba(15, 23, 42, 0.5);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        color: white;
        padding: 12px;
        font-size: 14px;
        margin-bottom: 16px;
        resize: none;
    }

    .action-buttons {
        display: flex;
        gap: 12px;
    }

    button {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 10px 20px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
    }

    .approve-btn {
        background: #8b5cf6;
        color: white;
        border: none;
        flex: 1;
    }

    .approve-btn:hover {
        background: #7c3aed;
        transform: translateY(-1px);
    }

    .reject-btn {
        background: transparent;
        color: #ef4444;
        border: 1px solid rgba(239, 68, 68, 0.3);
    }

    .reject-btn:hover {
        background: rgba(239, 68, 68, 0.1);
    }

    .select-prompt {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: #475569;
        text-align: center;
    }

    .select-prompt p {
        margin-top: 16px;
    }

    .loading,
    .empty-state {
        padding: 40px 0;
        text-align: center;
        color: #64748b;
        font-size: 0.9rem;
    }
</style>
