<script>
  import { Edit2, CopyMinus, Trash2, Link } from 'lucide-svelte';

  let { isOpen = $bindable(), position, node, onClose, onEdit, onDetach, onDelete, onAttach } = $props();

</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
{#if isOpen && node}
<div class="context-menu-backdrop" onclick={onClose} oncontextmenu={(e) => { e.preventDefault(); onClose(); }}>
  <div 
    class="context-menu glass-panel" 
    style="left: {position.x}px; top: {position.y}px;"
    onclick={(e) => e.stopPropagation()}
  >
    <div class="menu-header">
      <span class="provider-badge" style="color: var(--accent-{node.data.provider})">
        {node.data.provider.toUpperCase()}
      </span>
      <span class="node-name">{node.data.label} (ID: {node.id.split('-').pop()})</span>
    </div>

    <div class="menu-actions">
      <button class="menu-item" onclick={() => { onEdit(node); onClose(); }}>
        <Edit2 size={16} />
        <span>Edit Properties</span>
      </button>

      <button class="menu-item" onclick={() => { onAttach(node); onClose(); }}>
        <Link size={16} />
        <span>Attach To...</span>
      </button>

      <div class="divider"></div>

      <button class="menu-item text-warning" onclick={() => { onDetach(node); onClose(); }}>
        <CopyMinus size={16} />
        <span>Detach (Remove Edges)</span>
      </button>

      <button class="menu-item text-danger" onclick={() => { onDelete(node); onClose(); }}>
        <Trash2 size={16} />
        <span>Delete Resource</span>
      </button>
    </div>
  </div>
</div>

<style>
  .context-menu-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 1000;
  }

  .context-menu {
    position: absolute;
    min-width: 220px;
    background: rgba(15, 17, 21, 0.95);
    border: 1px solid var(--border-color);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: menu-pop 0.15s cubic-bezier(0.16, 1, 0.3, 1);
    transform-origin: top left;
  }

  @keyframes menu-pop {
    0% { transform: scale(0.95); opacity: 0; }
    100% { transform: scale(1); opacity: 1; }
  }

  .menu-header {
    padding: 12px 16px;
    background: rgba(0, 0, 0, 0.2);
    border-bottom: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .provider-badge {
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 1px;
  }

  .node-name {
    font-size: 0.8rem;
    font-weight: 500;
    color: var(--text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .menu-actions {
    display: flex;
    flex-direction: column;
    padding: 6px;
  }

  .menu-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    background: transparent;
    border: none;
    color: var(--text-main);
    font-size: 0.85rem;
    text-align: left;
    border-radius: 6px;
    transition: background 0.1s;
  }

  .menu-item:hover {
    background: var(--bg-panel-hover);
  }

  .text-warning {
    color: #eab308;
  }

  .text-warning:hover {
    background: rgba(234, 179, 8, 0.1);
  }

  .text-danger {
    color: #ef4444;
  }

  .text-danger:hover {
    background: rgba(239, 68, 68, 0.1);
  }

  .divider {
    height: 1px;
    background: var(--border-color);
    margin: 6px;
  }
</style>
