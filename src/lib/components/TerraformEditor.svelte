<script lang="ts">
    import { Save, Check, AlertCircle } from "lucide-svelte";

    let {
        code = $bindable(),
        type = "terraform",
        isSaving = $bindable(false),
        onSave = (newCode: string) => {},
    } = $props();

    let hasChanges = $state(false);
    let originalCode = $state(code);

    $effect(() => {
        if (code !== originalCode) {
            hasChanges = true;
        } else {
            hasChanges = false;
        }
    });

    function handleSave() {
        onSave(code);
        originalCode = code;
        hasChanges = false;
    }
</script>

<div class="editor-container">
    <div class="editor-header">
        <span class="file-label">
            {type === "terraform" ? "main.tf" : "k8s.yaml"}
        </span>
        {#if hasChanges}
            <div class="header-actions">
                <button
                    class="sync-canvas-btn"
                    onclick={() => onSave(code, true)}
                    title="Sync changes back to Visual Canvas"
                >
                    Sync to Canvas
                </button>
                <button
                    class="save-changes-btn"
                    onclick={handleSave}
                    disabled={isSaving}
                >
                    {#if isSaving}
                        <div class="spinner"></div>
                    {:else}
                        <Save size={14} />
                        Save Changes
                    {/if}
                </button>
            </div>
        {/if}
    </div>

    <textarea class="code-textarea" bind:value={code} spellcheck="false"
    ></textarea>
</div>

<style>
    .editor-container {
        display: flex;
        flex-direction: column;
        height: 100%;
        background: #1e1e1e;
        border-radius: 8px;
        overflow: hidden;
        border: 1px solid var(--border-color);
    }

    .editor-header {
        background: rgba(255, 255, 255, 0.05);
        padding: 8px 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid var(--border-color);
    }

    .file-label {
        font-family: "JetBrains Mono", monospace;
        font-size: 0.75rem;
        color: var(--text-muted);
    }

    .header-actions {
        display: flex;
        gap: 8px;
        align-items: center;
    }

    .sync-canvas-btn {
        background: rgba(139, 92, 246, 0.1);
        color: #a78bfa;
        border: 1px solid rgba(139, 92, 246, 0.3);
        padding: 4px 12px;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
    }

    .sync-canvas-btn:hover {
        background: rgba(139, 92, 246, 0.2);
        border-color: rgba(139, 92, 246, 0.5);
    }

    .save-changes-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        background: var(--accent-primary);
        color: white;
        border: none;
        padding: 4px 12px;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 600;
        cursor: pointer;
        transition: opacity 0.2s;
    }

    .save-changes-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .code-textarea {
        flex: 1;
        background: transparent;
        color: #d4d4d4;
        font-family: "JetBrains Mono", "Fira Code", monospace;
        font-size: 13px;
        line-height: 1.5;
        padding: 16px;
        border: none;
        resize: none;
        outline: none;
        tab-size: 2;
    }

    .spinner {
        width: 12px;
        height: 12px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: #fff;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }
</style>
