<script lang="ts">
    import { ShieldAlert, X, Check, ArrowRight } from "lucide-svelte";
    import { fade, slide } from "svelte/transition";

    let {
        isOpen = $bindable(),
        title = "Authorization Required",
        message = "",
        onConfirm = () => {},
        onCancel = () => {},
    } = $props();

    function handleConfirm() {
        onConfirm();
        isOpen = false;
    }

    function handleCancel() {
        onCancel();
        isOpen = false;
    }
</script>

{#if isOpen}
    <div
        class="confirm-backdrop"
        transition:fade={{ duration: 150 }}
        onclick={handleCancel}
        onkeydown={(e) => e.key === "Escape" && handleCancel()}
        role="button"
        tabindex="-1"
    >
        <div
            class="confirm-dialog glass-panel"
            onclick={(e) => e.stopPropagation()}
            onkeydown={(e) => e.stopPropagation()}
            role="none"
            transition:slide={{ duration: 200, axis: "y" }}
        >
            <div class="confirm-header">
                <div class="header-content">
                    <div class="shield-container">
                        <ShieldAlert size={20} />
                    </div>
                    <h3>{title}</h3>
                </div>
                <button class="close-btn" onclick={handleCancel}>
                    <X size={18} />
                </button>
            </div>

            <div class="confirm-body">
                <p>{message}</p>
                <div class="security-note">
                    <ArrowRight size={14} />
                    <span
                        >This action will modify your infrastructure hierarchy.</span
                    >
                </div>
            </div>

            <div class="confirm-footer">
                <button class="btn btn-ghost" onclick={handleCancel}
                    >Cancel</button
                >
                <button class="btn btn-primary" onclick={handleConfirm}>
                    <Check size={16} />
                    Confirm Action
                </button>
            </div>
        </div>
    </div>
{/if}

<style>
    .confirm-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 3000;
    }

    .confirm-dialog {
        width: 440px;
        max-width: 90vw;
        background: rgba(15, 17, 21, 0.98);
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 32px 64px rgba(0, 0, 0, 0.6);
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    .confirm-header {
        padding: 20px 24px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: rgba(255, 255, 255, 0.02);
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .header-content {
        display: flex;
        align-items: center;
        gap: 16px;
    }

    .shield-container {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        background: rgba(99, 102, 241, 0.1);
        border-radius: 8px;
        color: var(--accent-primary);
    }

    .confirm-header h3 {
        font-size: 1.1rem;
        font-weight: 600;
        margin: 0;
        color: var(--text-main);
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
        color: var(--text-main);
    }

    .confirm-body {
        padding: 28px 24px;
    }

    .confirm-body p {
        font-size: 1.05rem;
        line-height: 1.6;
        color: var(--text-main);
        margin: 0 0 20px 0;
    }

    .security-note {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 16px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 8px;
        color: var(--text-muted);
        font-size: 0.85rem;
    }

    .confirm-footer {
        padding: 20px 24px;
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        background: rgba(255, 255, 255, 0.02);
        border-top: 1px solid rgba(255, 255, 255, 0.05);
    }

    .btn {
        padding: 10px 20px;
        border-radius: 8px;
        font-size: 0.95rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        gap: 8px;
        border: 1px solid transparent;
    }

    .btn-ghost {
        background: transparent;
        color: var(--text-muted);
    }

    .btn-ghost:hover {
        background: rgba(255, 255, 255, 0.05);
        color: var(--text-main);
    }

    .btn-primary {
        background: var(--accent-primary);
        color: white;
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
    }

    .btn-primary:hover {
        background: #4f46e5;
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);
    }
</style>
