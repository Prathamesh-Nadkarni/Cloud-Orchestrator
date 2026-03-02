<script>
    import { AlertTriangle, X, Info } from "lucide-svelte";

    let {
        isOpen = $bindable(),
        title = "Notification",
        message = "",
        type = "warning",
        onClose = () => {},
    } = $props();

    function handleClose() {
        isOpen = false;
        if (onClose) onClose();
    }
</script>

{#if isOpen}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="alert-backdrop" onclick={handleClose}>
        <div
            class="alert-dialog glass-panel"
            onclick={(e) => e.stopPropagation()}
        >
            <div
                class="alert-header"
                class:type-warning={type === "warning"}
                class:type-error={type === "error"}
                class:type-info={type === "info"}
            >
                <div class="icon-title">
                    {#if type === "error"}
                        <AlertTriangle size={20} />
                    {:else if type === "warning"}
                        <AlertTriangle size={20} />
                    {:else}
                        <Info size={20} />
                    {/if}
                    <h3>{title}</h3>
                </div>
                <button class="close-btn" onclick={handleClose}>
                    <X size={18} />
                </button>
            </div>

            <div class="alert-body">
                <p>{message}</p>
            </div>

            <div class="alert-footer">
                <button class="btn btn-primary" onclick={handleClose}
                    >Got it</button
                >
            </div>
        </div>
    </div>
{/if}

<style>
    .alert-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2000;
    }

    .alert-dialog {
        width: 400px;
        max-width: 90vw;
        background: rgba(15, 17, 21, 0.98);
        border: 1px solid var(--border-color);
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
        display: flex;
        flex-direction: column;
        animation: alert-pop 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes alert-pop {
        from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
        }
        to {
            opacity: 1;
            transform: scale(1) translateY(0);
        }
    }

    .alert-header {
        padding: 16px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid var(--border-color);
    }

    .icon-title {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .type-warning h3,
    .type-warning :global(svg) {
        color: #eab308;
    }
    .type-error h3,
    .type-error :global(svg) {
        color: #ef4444;
    }
    .type-info h3,
    .type-info :global(svg) {
        color: #3b82f6;
    }

    h3 {
        font-size: 1rem;
        font-weight: 600;
        margin: 0;
    }

    .close-btn {
        background: transparent;
        border: none;
        color: var(--text-muted);
        cursor: pointer;
        padding: 4px;
        border-radius: 6px;
    }

    .close-btn:hover {
        background: var(--bg-panel-hover);
        color: var(--text-main);
    }

    .alert-body {
        padding: 24px 20px;
        font-size: 0.95rem;
        line-height: 1.6;
        color: var(--text-main);
    }

    .alert-footer {
        padding: 12px 20px;
        display: flex;
        justify-content: flex-end;
        border-top: 1px solid rgba(255, 255, 255, 0.05);
    }

    .btn {
        padding: 8px 24px;
        border-radius: 6px;
        font-size: 0.9rem;
        font-weight: 600;
        border: none;
        cursor: pointer;
        transition: all 0.2s;
    }

    .btn-primary {
        background: var(--accent-primary);
        color: white;
    }

    .btn-primary:hover {
        background: #818cf8;
        transform: translateY(-1px);
    }
</style>
