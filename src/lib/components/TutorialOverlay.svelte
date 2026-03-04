<script lang="ts">
    import {
        X,
        ArrowRight,
        Mouse,
        Link2,
        Layers,
        Code,
        BookOpen,
    } from "lucide-svelte";

    let {
        isOpen = false,
        onClose = () => {},
        onLoadSample = (_name: string) => {},
    }: {
        isOpen?: boolean;
        onClose?: () => void;
        onLoadSample?: (name: string) => void;
    } = $props();

    let activeTab = $state<"guide" | "samples">("guide");
    let pinpointMode = $state(false);

    $effect(() => {
        // Reset pinpoint mode when closed
        if (!isOpen) {
            pinpointMode = false;
        }
    });

    const samples = [
        {
            id: "multi-tier-aws",
            title: "3-Tier AWS Web App",
            desc: "Classic web → app → database architecture with VPC, subnets, and RDS replicas.",
            tags: ["AWS", "VPC", "RDS"],
        },
        {
            id: "azure-kubernetes",
            title: "Azure AKS Cluster",
            desc: "Production AKS cluster deployed inside an Azure VNet with SQL Server backend.",
            tags: ["Azure", "Kubernetes", "VNet"],
        },
        {
            id: "cross-csp-example",
            title: "Cross-CSP with Aviatrix",
            desc: "AWS VPC ↔ Aviatrix Transit ↔ Azure VNet multi-cloud backbone with EKS.",
            tags: ["AWS", "Azure", "Aviatrix"],
        },
        {
            id: "aviatrix-multi-cloud",
            title: "Global Multi-Cloud Transit",
            desc: "Three CSPs (AWS, Azure, GCP) connected via Aviatrix backbone with on-prem datacenter.",
            tags: ["AWS", "Azure", "GCP", "Aviatrix"],
        },
    ];
</script>

{#if isOpen}
    <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
    <div
        class="tutorial-overlay"
        role="dialog"
        aria-modal="true"
        tabindex="-1"
        onclick={() => {
            if (pinpointMode) {
                pinpointMode = false;
                onClose();
            } else {
                onClose();
            }
        }}
    >
        {#if pinpointMode}
            <!-- Pinpoints Render -->
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <div
                class="pinpoints-container"
                role="button"
                tabindex="0"
                onclick={(e) => {
                    e.stopPropagation();
                    pinpointMode = false;
                    onClose();
                }}
            >
                <div class="pinpoint" style="top: 80px; left: 240px;">
                    <div class="pinpoint-pulse"></div>
                    <div class="pinpoint-text">
                        Drag resources from Sidebar to Canvas
                    </div>
                </div>
                <div class="pinpoint" style="top: 15px; right: 520px;">
                    <div class="pinpoint-pulse"></div>
                    <div class="pinpoint-text">Toggle 2D / 3D ISO View</div>
                </div>
                <div class="pinpoint" style="top: 60px; right: 280px;">
                    <div class="pinpoint-pulse"></div>
                    <div class="pinpoint-text">
                        Load JSON / Terraform / Aviatrix DCF rules
                    </div>
                </div>
                <div class="pinpoint" style="top: 15px; right: 20px;">
                    <div class="pinpoint-pulse"></div>
                    <div class="pinpoint-text">
                        Generate K8s & Terraform Code
                    </div>
                </div>
                <div class="pinpoint" style="bottom: 40px; right: 40px;">
                    <div class="pinpoint-pulse"></div>
                    <div class="pinpoint-text">Semantic zoom and minimap</div>
                </div>
                <div class="pinpoint-help">
                    Click anywhere to close the tutorial
                </div>
            </div>
        {:else}
            <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions a11y_no_noninteractive_element_interactions -->
            <div
                class="tutorial-modal"
                role="presentation"
                onclick={(e) => e.stopPropagation()}
            >
                <!-- Header -->
                <div class="modal-header">
                    <h2>Getting Started</h2>
                    <button class="close-btn" onclick={onClose} title="Close">
                        <X size={18} />
                    </button>
                </div>

                <!-- Tabs -->
                <div class="tab-bar">
                    <button
                        class="tab"
                        class:active={activeTab === "guide"}
                        onclick={() => (activeTab = "guide")}
                    >
                        <BookOpen size={14} /> Guide
                    </button>
                    <button
                        class="tab"
                        class:active={activeTab === "samples"}
                        onclick={() => (activeTab = "samples")}
                    >
                        <Layers size={14} /> Load Sample
                    </button>
                    <div style="flex: 1;"></div>
                    <button
                        class="tab pinpoint-btn"
                        onclick={() => (pinpointMode = true)}
                    >
                        <Mouse size={14} /> Pinpoint UI
                    </button>
                </div>

                <!-- Guide Tab -->
                {#if activeTab === "guide"}
                    <div class="guide-content">
                        <div class="step">
                            <div class="step-icon"><Mouse size={20} /></div>
                            <div class="step-body">
                                <h3>1. Drag & Drop Resources</h3>
                                <p>
                                    Use the <strong>left sidebar</strong> to browse
                                    resources by cloud provider (AWS, Azure, GCP,
                                    Kubernetes, External). Drag any item onto the
                                    canvas to place it.
                                </p>
                            </div>
                        </div>

                        <div class="step">
                            <div class="step-icon"><Layers size={20} /></div>
                            <div class="step-body">
                                <h3>2. Nest Inside Containers</h3>
                                <p>
                                    Drop resources <strong
                                        >directly onto container nodes</strong
                                    > (VPCs, VNets, Subnets, K8s Clusters) to nest
                                    them. The system enforces provider-matching rules
                                    automatically.
                                </p>
                            </div>
                        </div>

                        <div class="step">
                            <div class="step-icon"><Link2 size={20} /></div>
                            <div class="step-body">
                                <h3>3. Connect with Network Rules</h3>
                                <p>
                                    Drag from a node's <strong
                                        >handle (small circle on right)</strong
                                    >
                                    to another node's handle to create a network
                                    connection. Click any edge to configure
                                    <strong>protocol</strong>
                                    (TCP, UDP, HTTPS) and <strong>port</strong>.
                                </p>
                            </div>
                        </div>

                        <div class="step">
                            <div class="step-icon"><Code size={20} /></div>
                            <div class="step-body">
                                <h3>4. Generate Infrastructure Code</h3>
                                <p>
                                    Click the green <strong>Generate</strong>
                                    button in the top nav. The system produces production-ready
                                    <strong>Terraform</strong>
                                    and
                                    <strong>Kubernetes manifests</strong> from your
                                    diagram, including security groups and network
                                    policies.
                                </p>
                            </div>
                        </div>

                        <div class="step">
                            <div class="step-icon">
                                <ArrowRight size={20} />
                            </div>
                            <div class="step-body">
                                <h3>5. Import & Export</h3>
                                <p>
                                    Use the top nav to <strong>Save/Load</strong
                                    >
                                    layouts to browser storage,
                                    <strong>Export/Import JSON</strong>
                                    files,
                                    <strong>import .tf Terraform files</strong>
                                    to auto-generate a canvas, or export as
                                    <strong>PNG</strong>. Toggle the
                                    <strong>3D View</strong> button for an isometric
                                    perspective.
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- Samples Tab -->
                {:else}
                    <div class="samples-content">
                        <p class="samples-intro">
                            Load a pre-built architecture to explore. This will
                            replace your current canvas.
                        </p>
                        {#each samples as sample}
                            <button
                                class="sample-card"
                                onclick={() => {
                                    onLoadSample(sample.id);
                                    onClose();
                                }}
                            >
                                <div class="sample-info">
                                    <h3>{sample.title}</h3>
                                    <p>{sample.desc}</p>
                                    <div class="sample-tags">
                                        {#each sample.tags as tag}
                                            <span class="tag">{tag}</span>
                                        {/each}
                                    </div>
                                </div>
                                <ArrowRight size={18} />
                            </button>
                        {/each}
                    </div>
                {/if}
            </div>
        {/if}
    </div>
{/if}

<style>
    .tutorial-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.65);
        backdrop-filter: blur(4px);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .tutorial-modal {
        background: var(--bg-panel);
        border: 1px solid var(--border-color);
        border-radius: 12px;
        width: 560px;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 24px 80px rgba(0, 0, 0, 0.6);
    }

    .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20px 24px 12px;
    }

    .modal-header h2 {
        margin: 0;
        font-size: 1.25rem;
        color: var(--text-main);
    }

    .close-btn {
        background: none;
        border: none;
        color: var(--text-muted);
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
    }
    .close-btn:hover {
        color: var(--text-main);
    }

    .tab-bar {
        display: flex;
        gap: 4px;
        padding: 0 24px 12px;
        border-bottom: 1px solid var(--border-color);
    }

    .tab {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 16px;
        background: none;
        border: none;
        border-radius: 6px;
        color: var(--text-muted);
        font-size: 0.85rem;
        cursor: pointer;
        transition: all 0.2s;
    }
    .tab:hover {
        background: var(--bg-panel-hover);
        color: var(--text-main);
    }
    .tab.active {
        background: var(--accent-primary);
        color: #fff;
    }

    /* Guide */
    .guide-content {
        padding: 16px 24px 24px;
    }

    .step {
        display: flex;
        gap: 14px;
        padding: 14px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }
    .step:last-child {
        border-bottom: none;
    }

    .step-icon {
        flex-shrink: 0;
        width: 36px;
        height: 36px;
        border-radius: 8px;
        background: rgba(59, 130, 246, 0.15);
        color: var(--accent-primary);
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .step-body h3 {
        margin: 0 0 4px;
        font-size: 0.9rem;
        color: var(--text-main);
    }

    .step-body p {
        margin: 0;
        font-size: 0.8rem;
        color: var(--text-muted);
        line-height: 1.5;
    }

    /* Samples */
    .samples-content {
        padding: 16px 24px 24px;
    }

    .samples-intro {
        font-size: 0.8rem;
        color: var(--text-muted);
        margin: 0 0 12px;
    }

    .sample-card {
        display: flex;
        align-items: center;
        gap: 12px;
        width: 100%;
        padding: 14px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        cursor: pointer;
        text-align: left;
        color: var(--text-muted);
        transition: all 0.2s;
        margin-bottom: 8px;
    }
    .sample-card:hover {
        background: rgba(59, 130, 246, 0.08);
        border-color: var(--accent-primary);
        color: var(--text-main);
    }

    .sample-info {
        flex: 1;
    }
    .sample-info h3 {
        margin: 0 0 4px;
        font-size: 0.9rem;
        color: var(--text-main);
    }
    .sample-info p {
        margin: 0 0 8px;
        font-size: 0.78rem;
        line-height: 1.4;
    }

    .sample-tags {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
    }
    .tag {
        font-size: 0.65rem;
        padding: 2px 8px;
        border-radius: 4px;
        background: rgba(59, 130, 246, 0.15);
        color: var(--accent-primary);
        font-weight: 600;
        letter-spacing: 0.3px;
    }

    /* Pinpoints */
    .pinpoints-container {
        position: absolute;
        inset: 0;
        pointer-events: auto;
    }
    .pinpoint {
        position: absolute;
        display: flex;
        align-items: center;
        gap: 12px;
        background: var(--bg-panel);
        border: 2px solid var(--accent-primary);
        padding: 8px 16px;
        border-radius: 8px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
        animation: float 3s ease-in-out infinite;
    }
    .pinpoint-pulse {
        width: 12px;
        height: 12px;
        background: var(--accent-primary);
        border-radius: 50%;
        box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.7);
        animation: pulse 2s infinite;
    }
    .pinpoint-text {
        color: var(--text-main);
        font-weight: 500;
        font-size: 0.9rem;
    }
    .pinpoint-help {
        position: absolute;
        bottom: 80px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 1.1rem;
        color: #fff;
        font-weight: bold;
        text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8);
        background: rgba(0, 0, 0, 0.5);
        padding: 8px 16px;
        border-radius: 20px;
    }
    @keyframes pulse {
        0% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.7);
        }
        70% {
            transform: scale(1);
            box-shadow: 0 0 0 10px rgba(139, 92, 246, 0);
        }
        100% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(139, 92, 246, 0);
        }
    }
    @keyframes float {
        0% {
            transform: translateY(0px);
        }
        50% {
            transform: translateY(-8px);
        }
        100% {
            transform: translateY(0px);
        }
    }
    .pinpoint-btn {
        color: var(--accent-primary);
        border: 1px dashed var(--accent-primary);
    }
    .pinpoint-btn:hover {
        background: rgba(139, 92, 246, 0.1);
    }
</style>
