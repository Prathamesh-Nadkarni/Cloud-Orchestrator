<script lang="ts">
    import {
        Search,
        Filter,
        Box,
        Plus,
        ExternalLink,
        CheckCircle2,
        Shield,
        Network,
        Database,
        ChevronRight,
        ArrowLeft,
    } from "lucide-svelte";
    import { onMount } from "svelte";
    import { fade, fly } from "svelte/transition";

    interface Product {
        id: string;
        name: string;
        slug: string;
        category: string;
        shortDescription: string;
        logoRef: string;
        supportedProviders: string[];
        vendor: {
            displayName: string;
            verificationStatus: string;
        };
        pricingMetadata?: {
            pricingModel: string;
            trialAvailable: boolean;
        };
    }

    let {
        onClose,
        onAddToDiagram,
    }: { onClose: () => void; onAddToDiagram: (p: Product) => void } = $props();

    let products = $state<Product[]>([]);
    let isLoading = $state(true);
    let searchQuery = $state("");
    let selectedCategory = $state("All");
    let categories = $state([
        "All",
        "Networking",
        "Security",
        "Storage",
        "Observability",
        "Identity",
    ]);
    let selectedProduct = $state<Product | null>(null);

    async function fetchProducts() {
        isLoading = true;
        try {
            const res = await fetch(
                `/api/marketplace/products?category=${selectedCategory === "All" ? "" : selectedCategory}&search=${searchQuery}`,
            );
            products = await res.json();
        } catch (error) {
            console.error("Failed to fetch products:", error);
        } finally {
            isLoading = false;
        }
    }

    $effect(() => {
        fetchProducts();
    });

    function getCategoryIcon(cat: string) {
        switch (cat) {
            case "Security":
                return Shield;
            case "Networking":
                return Network;
            case "Storage":
                return Database;
            default:
                return Box;
        }
    }
</script>

<div class="marketplace-backdrop" onclick={onClose}>
    <div
        class="marketplace-modal"
        onclick={(e) => e.stopPropagation()}
        transition:fly={{ y: 20 }}
    >
        {#if !selectedProduct}
            <header class="marketplace-header">
                <div class="title-section">
                    <h1>Infrastructure Marketplace</h1>
                    <p>
                        Extend your cloud architecture with verified vendor
                        integrations.
                    </p>
                </div>
                <button class="close-btn" onclick={onClose}>&times;</button>
            </header>

            <div class="marketplace-toolbar">
                <div class="search-box">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search vendors, products, or tags..."
                        bind:value={searchQuery}
                    />
                </div>
                <div class="filters">
                    {#each categories as cat}
                        <button
                            class="filter-chip"
                            class:active={selectedCategory === cat}
                            onclick={() => (selectedCategory = cat)}
                        >
                            {cat}
                        </button>
                    {/each}
                </div>
            </div>

            <div class="product-grid">
                {#if isLoading}
                    {#each Array(6) as _}
                        <div class="skeleton-card"></div>
                    {/each}
                {:else if products.length === 0}
                    <div class="empty-state">
                        <Box size={48} />
                        <h3>No products found</h3>
                        <p>Try adjusting your filters or search query.</p>
                    </div>
                {:else}
                    {#each products as product (product.id)}
                        <div
                            class="product-card"
                            onclick={() => (selectedProduct = product)}
                            transition:fade
                        >
                            <div class="card-header">
                                <div class="vendor-badge">
                                    <span class="vendor-name"
                                        >{product.vendor.displayName}</span
                                    >
                                    {#if product.vendor.verificationStatus === "VERIFIED"}
                                        <CheckCircle2
                                            size={12}
                                            color="#10b981"
                                        />
                                    {/if}
                                </div>
                                <span class="category-tag">
                                    <svelte:component
                                        this={getCategoryIcon(product.category)}
                                        size={12}
                                    />
                                    {product.category}
                                </span>
                            </div>
                            <div class="product-info">
                                <h3>{product.name}</h3>
                                <p>{product.shortDescription}</p>
                            </div>
                            <div class="card-footer">
                                <div class="providers">
                                    {#each product.supportedProviders as provider}
                                        <span class="provider-pill"
                                            >{provider}</span
                                        >
                                    {/each}
                                </div>
                                <ChevronRight size={18} />
                            </div>
                        </div>
                    {/each}
                {/if}
            </div>
        {:else}
            <!-- Product Detail View -->
            <div class="product-detail" in:fly={{ x: 50 }}>
                <button
                    class="back-btn"
                    onclick={() => (selectedProduct = null)}
                >
                    <ArrowLeft size={16} /> Back to Catalog
                </button>

                <div class="detail-content">
                    <div class="detail-header">
                        <div class="detail-main">
                            <div class="product-logo">
                                <Box size={48} />
                            </div>
                            <div class="title-block">
                                <h2>{selectedProduct.name}</h2>
                                <p class="vendor-line">
                                    by {selectedProduct.vendor.displayName}
                                </p>
                            </div>
                        </div>
                        <button
                            class="add-btn"
                            onclick={() => onAddToDiagram(selectedProduct!)}
                        >
                            <Plus size={18} /> Add to Diagram
                        </button>
                    </div>

                    <div class="detail-grid">
                        <div class="main-info">
                            <section>
                                <h4>Overview</h4>
                                <p>{selectedProduct.shortDescription}</p>
                            </section>
                            <section>
                                <h4>Provider Compatibility</h4>
                                <div class="provider-list">
                                    {#each selectedProduct.supportedProviders as p}
                                        <div class="provider-item active">
                                            <span class="status-dot"></span>
                                            {p.toUpperCase()} Fully Supported
                                        </div>
                                    {/each}
                                </div>
                            </section>
                        </div>
                        <div class="side-info">
                            <div class="meta-card">
                                <h4>Product Info</h4>
                                <div class="meta-row">
                                    <span>Category</span>
                                    <strong>{selectedProduct.category}</strong>
                                </div>
                                <div class="meta-row">
                                    <span>Pricing</span>
                                    <strong
                                        >{selectedProduct.pricingMetadata
                                            ?.pricingModel ||
                                            "Free Trial Available"}</strong
                                    >
                                </div>
                                <div class="meta-row">
                                    <span>Version</span>
                                    <strong>Latest</strong>
                                </div>
                            </div>
                            <a href="#" class="docs-link">
                                <ExternalLink size={14} /> View Documentation
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        {/if}
    </div>
</div>

<style>
    .marketplace-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(8px);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 40px;
    }

    .marketplace-modal {
        background: #0f172a;
        border: 1px solid rgba(255, 255, 255, 0.1);
        width: 100%;
        max-width: 1000px;
        height: 80vh;
        border-radius: 20px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }

    .marketplace-header {
        padding: 32px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
    }

    .marketplace-header h1 {
        font-size: 24px;
        margin: 0;
        color: #f8fafc;
    }

    .marketplace-header p {
        color: #94a3b8;
        margin: 4px 0 0;
    }

    .close-btn {
        background: none;
        border: none;
        color: #94a3b8;
        font-size: 32px;
        cursor: pointer;
        line-height: 1;
    }

    .marketplace-toolbar {
        padding: 20px 32px;
        background: rgba(0, 0, 0, 0.2);
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .search-box {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        display: flex;
        align-items: center;
        padding: 0 16px;
        color: #94a3b8;
    }

    .search-box input {
        background: none;
        border: none;
        padding: 12px;
        color: #f8fafc;
        width: 100%;
        outline: none;
    }

    .filters {
        display: flex;
        gap: 8px;
    }

    .filter-chip {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: #94a3b8;
        padding: 6px 14px;
        border-radius: 20px;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.2s;
    }

    .filter-chip:hover {
        background: rgba(255, 255, 255, 0.1);
    }

    .filter-chip.active {
        background: #3b82f6;
        border-color: #3b82f6;
        color: white;
    }

    .product-grid {
        padding: 32px;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 24px;
        overflow-y: auto;
        flex: 1;
    }

    .product-card {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 16px;
        padding: 20px;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .product-card:hover {
        background: rgba(255, 255, 255, 0.05);
        border-color: rgba(255, 255, 255, 0.2);
        transform: translateY(-2px);
    }

    .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .vendor-badge {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #94a3b8;
    }

    .category-tag {
        background: rgba(255, 255, 255, 0.05);
        padding: 4px 8px;
        border-radius: 6px;
        font-size: 11px;
        display: flex;
        align-items: center;
        gap: 4px;
        color: #64748b;
    }

    .product-info h3 {
        margin: 0;
        font-size: 18px;
        color: #f8fafc;
    }

    .product-info p {
        margin: 8px 0 0;
        font-size: 13px;
        color: #94a3b8;
        line-height: 1.5;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    .card-footer {
        margin-top: auto;
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: #475569;
    }

    .provider-pill {
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        color: #3b82f6;
        margin-right: 8px;
    }

    .product-detail {
        padding: 32px;
        flex: 1;
        overflow-y: auto;
    }

    .back-btn {
        background: none;
        border: none;
        color: #94a3b8;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        margin-bottom: 24px;
    }

    .detail-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 32px;
    }

    .detail-main {
        display: flex;
        align-items: center;
        gap: 20px;
    }

    .product-logo {
        width: 64px;
        height: 64px;
        background: #1e293b;
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #3b82f6;
    }

    .title-block h2 {
        margin: 0;
        font-size: 28px;
        color: #f8fafc;
    }

    .vendor-line {
        margin: 4px 0 0;
        color: #94a3b8;
    }

    .add-btn {
        background: #3b82f6;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 12px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 10px;
        cursor: pointer;
        transition: all 0.2s;
    }

    .add-btn:hover {
        background: #2563eb;
        box-shadow: 0 0 20px rgba(59, 130, 246, 0.4);
    }

    .detail-grid {
        display: grid;
        grid-template-columns: 1fr 300px;
        gap: 40px;
    }

    .main-info section {
        margin-bottom: 32px;
    }

    .main-info h4 {
        color: #f8fafc;
        margin-bottom: 12px;
        font-size: 16px;
    }

    .main-info p {
        color: #94a3b8;
        line-height: 1.6;
    }

    .provider-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .provider-item {
        display: flex;
        align-items: center;
        gap: 12px;
        color: #64748b;
        font-size: 14px;
    }

    .provider-item.active {
        color: #94a3b8;
    }

    .status-dot {
        width: 8px;
        height: 8px;
        background: #10b981;
        border-radius: 50%;
        box-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
    }

    .meta-card {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 16px;
        padding: 24px;
        margin-bottom: 16px;
    }

    .meta-row {
        display: flex;
        justify-content: space-between;
        padding: 12px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        font-size: 14px;
    }

    .meta-row:last-child {
        border-bottom: none;
    }

    .meta-row span {
        color: #64748b;
    }

    .meta-row strong {
        color: #f8fafc;
    }

    .docs-link {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #3b82f6;
        font-size: 14px;
        text-decoration: none;
        padding: 12px;
    }

    .skeleton-card {
        height: 200px;
        background: rgba(255, 255, 255, 0.02);
        border-radius: 16px;
        animation: pulse 2s infinite;
    }

    @keyframes pulse {
        0%,
        100% {
            opacity: 1;
        }
        50% {
            opacity: 0.5;
        }
    }
</style>
