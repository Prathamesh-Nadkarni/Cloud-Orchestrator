/**
 * Product Suggestion Panel Component
 * Shows intelligent recommendations for security products based on architecture analysis
 */

<script lang="ts">
  import { 
    Lightbulb, 
    CheckCircle2, 
    AlertTriangle, 
    Info, 
    Plus,
    X,
    ChevronDown,
    ChevronRight,
    Sparkles
  } from 'lucide-svelte';
  import { generateProductSuggestions, applySuggestion, type ProductSuggestion } from '$lib/intelligence/suggestion-engine';
  import { fade, slide } from 'svelte/transition';

  let {
    nodes = [],
    edges = [],
    onApplySuggestion,
    isOpen = $bindable(false)
  }: {
    nodes: any[];
    edges: any[];
    onApplySuggestion: (node: any) => void;
    isOpen?: boolean;
  } = $props();

  let suggestions = $derived(generateProductSuggestions(nodes, edges));
  let expandedSuggestions = $state(new Set<string>());
  let appliedSuggestions = $state(new Set<string>());

  const priorityConfig = {
    critical: { color: '#ef4444', icon: AlertTriangle, label: 'Critical' },
    high: { color: '#f97316', icon: AlertTriangle, label: 'High Priority' },
    medium: { color: '#f59e0b', icon: Info, label: 'Recommended' },
    low: { color: '#3b82f6', icon: Info, label: 'Optional' }
  };

  function toggleExpanded(suggestionKey: string) {
    if (expandedSuggestions.has(suggestionKey)) {
      expandedSuggestions.delete(suggestionKey);
    } else {
      expandedSuggestions.add(suggestionKey);
    }
    expandedSuggestions = new Set(expandedSuggestions);
  }

  function handleApply(suggestion: ProductSuggestion) {
    const newNode = applySuggestion(suggestion, nodes);
    if (newNode) {
      onApplySuggestion(newNode);
      appliedSuggestions.add(suggestion.productKey);
      appliedSuggestions = new Set(appliedSuggestions);
    }
  }

  const criticalCount = $derived(suggestions.filter(s => s.priority === 'critical').length);
  const highCount = $derived(suggestions.filter(s => s.priority === 'high').length);
  const mediumCount = $derived(suggestions.filter(s => s.priority === 'medium').length);
</script>

{#if isOpen}
  <div class="suggestion-panel glass-panel" transition:fade={{ duration: 200 }}>
    <div class="panel-header">
      <div class="header-content">
        <Sparkles size={20} color="var(--accent-primary)" />
        <h3>Security Recommendations</h3>
        <div class="suggestion-count">
          {suggestions.length} {suggestions.length === 1 ? 'suggestion' : 'suggestions'}
        </div>
      </div>
      <button class="close-btn" onclick={() => isOpen = false}>
        <X size={18} />
      </button>
    </div>

    {#if suggestions.length === 0}
      <div class="empty-state">
        <CheckCircle2 size={48} color="#10b981" opacity="0.3" />
        <p class="empty-title">All set!</p>
        <p class="empty-desc">Your architecture has comprehensive security coverage.</p>
      </div>
    {:else}
      <div class="summary-stats">
        {#if criticalCount > 0}
          <div class="stat-item critical">
            <span class="stat-count">{criticalCount}</span>
            <span class="stat-label">Critical</span>
          </div>
        {/if}
        {#if highCount > 0}
          <div class="stat-item high">
            <span class="stat-count">{highCount}</span>
            <span class="stat-label">High Priority</span>
          </div>
        {/if}
        {#if mediumCount > 0}
          <div class="stat-item medium">
            <span class="stat-count">{mediumCount}</span>
            <span class="stat-label">Recommended</span>
          </div>
        {/if}
      </div>

      <div class="suggestions-list">
        {#each suggestions as suggestion (suggestion.productKey)}
          {@const config = priorityConfig[suggestion.priority]}
          {@const isExpanded = expandedSuggestions.has(suggestion.productKey)}
          {@const isApplied = appliedSuggestions.has(suggestion.productKey)}
          
          <div class="suggestion-card" class:applied={isApplied} transition:slide>
            <button 
              class="suggestion-header" 
              onclick={() => toggleExpanded(suggestion.productKey)}
              class:expanded={isExpanded}
            >
              <div class="header-left">
                <svelte:component this={config.icon} size={18} color={config.color} />
                <div class="product-info">
                  <span class="product-name">{suggestion.productName}</span>
                  <span class="product-vendor">{suggestion.vendor}</span>
                </div>
              </div>
              <div class="header-right">
                <span class="priority-badge" style="background: {config.color}20; color: {config.color}">
                  {config.label}
                </span>
                {#if isExpanded}
                  <ChevronDown size={16} />
                {:else}
                  <ChevronRight size={16} />
                {/if}
              </div>
            </button>

            {#if isExpanded}
              <div class="suggestion-content" transition:slide>
                <div class="reason-section">
                  <h4>Why this matters:</h4>
                  <p>{suggestion.reason}</p>
                </div>

                <div class="affected-section">
                  <h4>Affects {suggestion.affectedResources.length} resource(s):</h4>
                  <div class="resource-list">
                    {#each suggestion.affectedResources.slice(0, 5) as resourceId}
                      <span class="resource-tag">{resourceId}</span>
                    {/each}
                    {#if suggestion.affectedResources.length > 5}
                      <span class="resource-more">+{suggestion.affectedResources.length - 5} more</span>
                    {/if}
                  </div>
                </div>

                <div class="placement-info">
                  <h4>Integration Type:</h4>
                  <span class="placement-badge">{suggestion.placement.type.replace(/-/g, ' ')}</span>
                </div>

                {#if suggestion.autoConfig}
                  <div class="config-preview">
                    <h4>Auto-configuration:</h4>
                    <ul>
                      {#each Object.entries(suggestion.autoConfig).slice(0, 3) as [key, value]}
                        <li>
                          <span class="config-key">{key}:</span>
                          <span class="config-value">{typeof value === 'boolean' ? (value ? '✓' : '✗') : String(value)}</span>
                        </li>
                      {/each}
                    </ul>
                  </div>
                {/if}

                <div class="action-buttons">
                  {#if isApplied}
                    <button class="btn-applied" disabled>
                      <CheckCircle2 size={16} />
                      Applied
                    </button>
                  {:else}
                    <button class="btn-apply" onclick={() => handleApply(suggestion)}>
                      <Plus size={16} />
                      Apply Suggestion
                    </button>
                  {/if}
                </div>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>
{/if}

<style>
  .suggestion-panel {
    position: fixed;
    right: 20px;
    top: 80px;
    width: 420px;
    max-height: calc(100vh - 100px);
    display: flex;
    flex-direction: column;
    background: rgba(15, 23, 42, 0.98);
    border: 1px solid rgba(139, 92, 246, 0.3);
    border-radius: 16px;
    overflow: hidden;
    z-index: 100;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
  }

  .panel-header {
    padding: 20px 24px;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(0, 0, 0, 0.2);
  }

  .header-content {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .panel-header h3 {
    font-size: 1.1rem;
    font-weight: 600;
    margin: 0;
    color: var(--text-main);
  }

  .suggestion-count {
    font-size: 0.75rem;
    color: var(--text-muted);
    background: rgba(139, 92, 246, 0.15);
    padding: 3px 10px;
    border-radius: 12px;
    font-weight: 600;
  }

  .close-btn {
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 4px;
    border-radius: 6px;
    transition: all 0.2s;
  }

  .close-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: var(--text-main);
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 40px;
    text-align: center;
  }

  .empty-title {
    font-size: 1.2rem;
    font-weight: 600;
    color: var(--text-main);
    margin: 16px 0 8px 0;
  }

  .empty-desc {
    font-size: 0.9rem;
    color: var(--text-muted);
    margin: 0;
  }

  .summary-stats {
    display: flex;
    gap: 12px;
    padding: 16px 24px;
    background: rgba(0, 0, 0, 0.15);
    border-bottom: 1px solid var(--border-color);
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 8px 16px;
    border-radius: 8px;
    flex: 1;
  }

  .stat-item.critical {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
  }

  .stat-item.high {
    background: rgba(249, 115, 22, 0.1);
    border: 1px solid rgba(249, 115, 22, 0.3);
  }

  .stat-item.medium {
    background: rgba(245, 158, 11, 0.1);
    border: 1px solid rgba(245, 158, 11, 0.3);
  }

  .stat-count {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-main);
  }

  .stat-label {
    font-size: 0.7rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 600;
  }

  .suggestions-list {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .suggestion-card {
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.2s;
  }

  .suggestion-card.applied {
    opacity: 0.6;
    border-color: #10b981;
  }

  .suggestion-header {
    width: 100%;
    padding: 14px 16px;
    background: none;
    border: none;
    color: var(--text-main);
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: all 0.2s;
  }

  .suggestion-header:hover {
    background: rgba(255, 255, 255, 0.05);
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .product-info {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
  }

  .product-name {
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--text-main);
  }

  .product-vendor {
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .priority-badge {
    font-size: 0.7rem;
    font-weight: 700;
    padding: 4px 10px;
    border-radius: 6px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .suggestion-content {
    padding: 0 16px 16px 16px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .reason-section h4,
  .affected-section h4,
  .placement-info h4,
  .config-preview h4 {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-muted);
    margin: 0 0 6px 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .reason-section p {
    font-size: 0.9rem;
    color: var(--text-main);
    margin: 0;
    line-height: 1.5;
  }

  .resource-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .resource-tag {
    font-size: 0.75rem;
    color: var(--accent-primary);
    background: rgba(139, 92, 246, 0.1);
    border: 1px solid rgba(139, 92, 246, 0.3);
    padding: 3px 8px;
    border-radius: 4px;
    font-family: monospace;
  }

  .resource-more {
    font-size: 0.75rem;
    color: var(--text-muted);
    font-style: italic;
    padding: 3px 8px;
  }

  .placement-badge {
    font-size: 0.8rem;
    color: var(--text-main);
    background: rgba(255, 255, 255, 0.05);
    padding: 5px 12px;
    border-radius: 6px;
    text-transform: capitalize;
    border: 1px solid var(--border-color);
  }

  .config-preview ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .config-preview li {
    font-size: 0.85rem;
    color: var(--text-muted);
    padding: 4px 0;
    display: flex;
    gap: 8px;
  }

  .config-key {
    font-weight: 600;
    color: var(--text-main);
  }

  .config-value {
    color: var(--accent-primary);
    font-family: monospace;
    font-size: 0.8rem;
  }

  .action-buttons {
    display: flex;
    gap: 10px;
    padding-top: 8px;
  }

  .btn-apply, .btn-applied {
    flex: 1;
    padding: 10px 16px;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .btn-apply {
    background: var(--accent-primary);
    border: none;
    color: white;
  }

  .btn-apply:hover {
    background: #7c3aed;
    transform: translateY(-1px);
  }

  .btn-applied {
    background: rgba(16, 185, 129, 0.15);
    border: 1px solid #10b981;
    color: #10b981;
    cursor: not-allowed;
  }
</style>
