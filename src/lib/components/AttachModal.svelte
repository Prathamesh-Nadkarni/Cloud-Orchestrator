<script>
  import { X, Check } from 'lucide-svelte';

  let { isOpen, sourceNode, availableNodes, existingEdges, onClose, onSave } = $props();

  // Local state for checkboxes
  let selectedTargetIds = $state([]);

  // When modal opens, initialize checkboxes based on existing edges
  $effect(() => {
    if (isOpen && sourceNode) {
      const connectedIds = existingEdges
        .filter(e => e.source === sourceNode.id || e.target === sourceNode.id)
        .map(e => e.source === sourceNode.id ? e.target : e.source);
      
      selectedTargetIds = [...new Set(connectedIds)];
    }
  });

  function toggleSelection(nodeId) {
    if (selectedTargetIds.includes(nodeId)) {
      selectedTargetIds = selectedTargetIds.filter(id => id !== nodeId);
    } else {
      selectedTargetIds = [...selectedTargetIds, nodeId];
    }
  }

  function handleSave() {
    onSave(sourceNode.id, selectedTargetIds);
    onClose();
  }
</script>

{#if isOpen && sourceNode}
  <div class="modal-backdrop" onclick={onClose}>
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="attach-modal glass-panel" onclick={(e) => e.stopPropagation()}>
      <div class="modal-header">
        <div class="header-titles">
          <h3>Attach Resource</h3>
          <p>Select resources to connect with <span class="highlight">{sourceNode.data.label}</span></p>
        </div>
        <button class="close-btn" onclick={onClose}>
          <X size={20} />
        </button>
      </div>

      <div class="node-list">
        {#if availableNodes.length === 0}
          <div class="empty-state">No other resources on the canvas to attach to.</div>
        {:else}
          {#each availableNodes as node (node.id)}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div 
              class="node-item" 
              class:selected={selectedTargetIds.includes(node.id)}
              onclick={() => toggleSelection(node.id)}
            >
              <div class="checkbox">
                {#if selectedTargetIds.includes(node.id)}
                  <Check size={14} strokeWidth={3} />
                {/if}
              </div>
              <div class="node-info">
                <span class="provider" style="color: var(--accent-{node.data.provider})">
                  {node.data.provider.toUpperCase()}
                </span>
                <span class="name">{node.data.label}</span>
                {#if node.data.name}
                  <span class="custom-name">({node.data.name})</span>
                {/if}
              </div>
            </div>
          {/each}
        {/if}
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" onclick={onClose}>Cancel</button>
        <button class="btn btn-primary" onclick={handleSave}>Save Connections</button>
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
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1100;
  }

  .attach-modal {
    width: 480px;
    max-width: 90vw;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    background: rgba(15, 17, 21, 0.98);
    animation: slide-up 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }

  @keyframes slide-up {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 20px 24px;
    border-bottom: 1px solid var(--border-color);
  }

  .header-titles h3 {
    font-size: 1.2rem;
    font-weight: 600;
    margin-bottom: 4px;
  }

  .header-titles p {
    font-size: 0.85rem;
    color: var(--text-muted);
  }

  .highlight {
    color: var(--text-main);
    font-weight: 600;
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

  .node-list {
    flex: 1;
    overflow-y: auto;
    padding: 16px 24px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .empty-state {
    padding: 40px 0;
    text-align: center;
    color: var(--text-muted);
    font-size: 0.9rem;
  }

  .node-item {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 12px 16px;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    background: rgba(0, 0, 0, 0.2);
  }

  .node-item:hover {
    border-color: var(--border-focus);
    background: rgba(255, 255, 255, 0.03);
  }

  .node-item.selected {
    border-color: var(--accent-primary);
    background: rgba(99, 102, 241, 0.1);
  }

  .checkbox {
    width: 20px;
    height: 20px;
    border: 2px solid var(--text-muted);
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    transition: all 0.2s;
  }

  .node-item.selected .checkbox {
    background: var(--accent-primary);
    border-color: var(--accent-primary);
  }

  .node-info {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.9rem;
  }

  .provider {
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.5px;
  }

  .name {
    font-weight: 500;
    color: var(--text-main);
  }

  .custom-name {
    color: var(--text-muted);
    font-size: 0.8rem;
  }

  .modal-footer {
    padding: 16px 24px;
    border-top: 1px solid var(--border-color);
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }

  .btn {
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 0.9rem;
    font-weight: 500;
    border: none;
    transition: all 0.2s;
  }

  .btn-secondary {
    background: transparent;
    color: var(--text-main);
    border: 1px solid var(--border-color);
  }

  .btn-secondary:hover {
    background: var(--bg-panel-hover);
  }

  .btn-primary {
    background: var(--accent-primary);
    color: white;
    box-shadow: 0 0 10px rgba(99, 102, 241, 0.4);
  }

  .btn-primary:hover {
    background: #818cf8;
    box-shadow: 0 0 15px rgba(99, 102, 241, 0.6);
  }
</style>
