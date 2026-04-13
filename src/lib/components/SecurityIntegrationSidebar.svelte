/**
 * Security Integration Sidebar Component
 * Displays security and infrastructure vendor integrations available for the diagram
 */

<script>
  import {
    Shield,
    Eye,
    Key,
    Network,
    CloudCog,
    Database,
    Search,
    ExternalLink,
    ChevronDown,
    ChevronRight,
  } from "lucide-svelte";
  import { SECURITY_VENDORS } from "$lib/blockly/security-vendors";
  import { globalState, clearDragState } from "$lib/client/state.svelte";

  let { onAddIntegration } = $props();

  let searchQuery = $state("");
  let expandedCategories = $state(new Set(["CNAPP", "SASE", "Observability"]));

  const categoryIcons = {
    CNAPP: Shield,
    Endpoint: Shield,
    Identity: Key,
    SASE: Network,
    Observability: Eye,
    Resilience: CloudCog,
    Secrets: Key,
  };

  // Group vendors by category
  const vendorsByCategory = $derived.by(() => {
    const grouped = {};
    
    for (const [key, vendor] of Object.entries(SECURITY_VENDORS)) {
      const category = vendor.category;
      if (!grouped[category]) {
        grouped[category] = [];
      }
      
      // Filter by search query
      if (
        searchQuery === "" ||
        vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vendor.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vendor.description.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        grouped[category].push({ key, ...vendor });
      }
    }
    
    return grouped;
  });

  function toggleCategory(category) {
    if (expandedCategories.has(category)) {
      expandedCategories.delete(category);
    } else {
      expandedCategories.add(category);
    }
    expandedCategories = new Set(expandedCategories);
  }

  function handleDragStart(event, vendorKey, vendor) {
    event.dataTransfer.setData("application/svelteflow", "vendor-integration");
    event.dataTransfer.setData("application/vendor-key", vendorKey);
    event.dataTransfer.setData("application/label", vendor.name);
    event.dataTransfer.setData("application/vendor-data", JSON.stringify(vendor));
    event.dataTransfer.effectAllowed = "move";
    // Set drag context so drop-zone highlighting knows what's being dragged
    globalState.dragContext = { type: "vendor-integration", provider: vendorKey };
  }

  function handleDragEnd() {
    clearDragState();
  }
</script>

<aside class="security-sidebar glass-panel">
  <div class="sidebar-header">
    <div class="title-row">
      <Shield size={20} color="var(--accent-primary)" />
      <h3>Security & Integrations</h3>
    </div>
    <div class="search-box">
      <Search size={14} class="search-icon" />
      <input
        type="text"
        placeholder="Search integrations..."
        bind:value={searchQuery}
      />
    </div>
  </div>

  <div class="vendor-list">
    {#if Object.keys(vendorsByCategory).length === 0}
      <div class="empty-state">
        <Search size={32} opacity="0.2" />
        <p>No integrations found</p>
      </div>
    {:else}
      {#each Object.entries(vendorsByCategory) as [category, vendors]}
        {#if vendors.length > 0}
          <div class="category-section">
            <button class="category-header" onclick={() => toggleCategory(category)}>
              <div class="category-title">
                {#if expandedCategories.has(category)}
                  <ChevronDown size={16} />
                {:else}
                  <ChevronRight size={16} />
                {/if}
                <svelte:component this={categoryIcons[category] || Shield} size={16} />
                <span>{category}</span>
                <span class="vendor-count">{vendors.length}</span>
              </div>
            </button>

            {#if expandedCategories.has(category)}
              <div class="vendor-grid">
                {#each vendors as vendor}
                  <!-- svelte-ignore a11y_no_static_element_interactions -->
                  <div
                    class="vendor-card"
                    draggable={true}
                    ondragstart={(e) => handleDragStart(e, vendor.key, vendor)}
                    ondragend={handleDragEnd}
                    title={vendor.description}
                  >
                    <div class="vendor-header">
                      <div class="vendor-icon" style="background-color: {vendor.color}15; color: {vendor.color}">
                        {vendor.icon}
                      </div>
                      <div class="vendor-info">
                        <div class="vendor-name">{vendor.name}</div>
                        <div class="vendor-company">{vendor.company}</div>
                      </div>
                    </div>
                    
                    <div class="integration-mode-tag">
                      {vendor.integrationMode.replace(/_/g, ' ')}
                    </div>

                    <div class="vendor-requirements">
                      <div class="requirement-tag" class:active={vendor.requirements.api_key}>
                        {#if vendor.requirements.api_key}
                          <span class="dot"></span> API Key
                        {/if}
                      </div>
                      <div class="requirement-tag" class:active={vendor.requirements.agent_deployment}>
                        {#if vendor.requirements.agent_deployment}
                          <span class="dot"></span> Agent
                        {/if}
                      </div>
                      <div class="requirement-tag" class:active={vendor.requirements.cloud_accounts && vendor.requirements.cloud_accounts.length > 0}>
                        {#if vendor.requirements.cloud_accounts && vendor.requirements.cloud_accounts.length > 0}
                          <span class="dot"></span> {vendor.requirements.cloud_accounts.length} CSPs
                        {/if}
                      </div>
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        {/if}
      {/each}
    {/if}
  </div>

  <div class="sidebar-footer">
    <a href="/marketplace" class="marketplace-link">
      <ExternalLink size={14} />
      Browse Full Marketplace
    </a>
  </div>
</aside>

<style>
  .security-sidebar {
    width: 320px;
    height: 100%;
    border-radius: 0;
    border-top: none;
    border-bottom: none;
    border-left: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    background: rgba(15, 17, 21, 0.85);
    z-index: 40;
  }

  .sidebar-header {
    padding: 20px;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .title-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .sidebar-header h3 {
    font-size: 1.05rem;
    font-weight: 600;
    margin: 0;
    letter-spacing: -0.3px;
    color: var(--text-main);
  }

  .search-box {
    position: relative;
    display: flex;
    align-items: center;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 0 12px;
    transition: all 0.2s;
  }

  .search-box:focus-within {
    border-color: var(--accent-primary);
    background: rgba(255, 255, 255, 0.05);
  }

  .search-icon {
    color: var(--text-muted);
  }

  .search-box input {
    background: none;
    border: none;
    color: var(--text-main);
    padding: 8px;
    flex: 1;
    outline: none;
    font-size: 0.85rem;
  }

  .vendor-list {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    color: var(--text-muted);
    text-align: center;
    gap: 12px;
  }

  .empty-state p {
    font-size: 0.85rem;
  }

  .category-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .category-header {
    background: none;
    border: none;
    color: var(--text-main);
    cursor: pointer;
    padding: 0;
    width: 100%;
  }

  .category-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.85rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 8px 0;
    color: var(--text-main);
    transition: color 0.2s;
  }

  .category-header:hover .category-title {
    color: var(--accent-primary);
  }

  .vendor-count {
    margin-left: auto;
    background: rgba(139, 92, 246, 0.15);
    color: var(--accent-primary);
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 0.7rem;
    font-weight: 700;
  }

  .vendor-grid {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding-left: 8px;
  }

  .vendor-card {
    background: var(--bg-panel);
    border: 1px solid var(--border-color);
    border-radius: 10px;
    padding: 12px;
    cursor: grab;
    transition: all 0.2s ease;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .vendor-card:hover {
    background: var(--bg-panel-hover);
    border-color: var(--accent-primary);
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(139, 92, 246, 0.15);
  }

  .vendor-card:active {
    cursor: grabbing;
    transform: translateY(0);
  }

  .vendor-header {
    display: flex;
    align-items: flex-start;
    gap: 10px;
  }

  .vendor-icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    flex-shrink: 0;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .vendor-info {
    flex: 1;
    min-width: 0;
  }

  .vendor-name {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-main);
    line-height: 1.2;
    margin-bottom: 2px;
  }

  .vendor-company {
    font-size: 0.7rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 500;
  }

  .integration-mode-tag {
    font-size: 0.7rem;
    color: var(--accent-primary);
    background: rgba(139, 92, 246, 0.1);
    border: 1px solid rgba(139, 92, 246, 0.3);
    padding: 4px 8px;
    border-radius: 4px;
    font-weight: 600;
    text-transform: capitalize;
    width: fit-content;
  }

  .vendor-requirements {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 4px;
  }

  .requirement-tag {
    display: none;
    align-items: center;
    gap: 4px;
    font-size: 0.7rem;
    color: #64748b;
    background: rgba(100, 116, 139, 0.1);
    padding: 3px 6px;
    border-radius: 3px;
    font-weight: 500;
  }

  .requirement-tag.active {
    display: flex;
  }

  .requirement-tag .dot {
    width: 4px;
    height: 4px;
    background: currentColor;
    border-radius: 50%;
  }

  .sidebar-footer {
    padding: 16px 20px;
    border-top: 1px solid var(--border-color);
  }

  .marketplace-link {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px;
    background: rgba(139, 92, 246, 0.1);
    border: 1px solid rgba(139, 92, 246, 0.3);
    border-radius: 8px;
    color: var(--accent-primary);
    font-size: 0.85rem;
    font-weight: 600;
    text-decoration: none;
    transition: all 0.2s;
  }

  .marketplace-link:hover {
    background: rgba(139, 92, 246, 0.2);
    border-color: var(--accent-primary);
  }
</style>
