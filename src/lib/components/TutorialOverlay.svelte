<script lang="ts">
    import { X } from "lucide-svelte";

    let {
        isOpen = false,
        onClose = () => {},
    }: { isOpen?: boolean; onClose?: () => void } = $props();
</script>

{#if isOpen}
    <div class="tutorial-overlay">
        <!-- Close button -->
        <button class="close-btn" onclick={onClose} title="Close Tutorial">
            <X size={24} />
        </button>

        <!-- TopNav Highlight -->
        <div class="highlight top-nav-highlight">
            <div class="tutorial-card bottom">
                <h3>Top Navigation</h3>
                <p>
                    Save/Load layouts, toggle 3D View, export to PNG/JSON, and
                    Generate infrastructure code.
                </p>
            </div>
        </div>

        <!-- Sidebar Highlight -->
        <div class="highlight sidebar-highlight">
            <div class="tutorial-card right">
                <h3>Resource Sidebar</h3>
                <p>
                    Drag and drop multi-cloud resources and containers onto the
                    workspace to start building.
                </p>
            </div>
        </div>

        <!-- Canvas Highlight -->
        <div class="highlight canvas-highlight">
            <div class="tutorial-card center">
                <h3>Interactive Canvas</h3>
                <p>
                    Drop items here! Nest them inside containers (like VPCs),
                    and drag lines between them to create network rules.
                </p>
            </div>
        </div>

        <!-- Drawer Hint -->
        <div class="highlight drawer-highlight">
            <div class="tutorial-card left">
                <h3>Property Drawer</h3>
                <p>
                    Click any node or connection line to open the Drawer here
                    and configure names, types, and ports.
                </p>
            </div>
        </div>
    </div>
{/if}

<style>
    .tutorial-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(10, 11, 15, 0.7);
        backdrop-filter: blur(2px);
        z-index: 9999;
        pointer-events: auto; /* Block interactions below */
    }

    .close-btn {
        position: absolute;
        top: 80px;
        right: 20px;
        background: var(--bg-panel);
        border: 1px solid var(--border-color);
        color: var(--text-main);
        border-radius: 50%;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        transition: all 0.2s;
    }

    .close-btn:hover {
        background: var(--bg-panel-hover);
        transform: scale(1.1);
    }

    .highlight {
        position: absolute;
        border: 2px dashed rgba(255, 255, 255, 0.6);
        border-radius: 8px;
        box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
        animation: pulse 2s infinite alternate;
    }

    @keyframes pulse {
        0% {
            border-color: rgba(59, 130, 246, 0.4);
            box-shadow: 0 0 10px rgba(59, 130, 246, 0.2);
        }
        100% {
            border-color: rgba(59, 130, 246, 0.9);
            box-shadow: 0 0 30px rgba(59, 130, 246, 0.5);
        }
    }

    /* Specific Highlights */
    .top-nav-highlight {
        top: 8px;
        left: 8px;
        right: 8px;
        height: 48px;
    }

    .sidebar-highlight {
        top: 64px;
        left: 8px;
        width: 264px;
        bottom: 8px;
    }

    .canvas-highlight {
        top: 64px;
        left: 288px;
        right: 8px;
        bottom: 8px;
    }

    .drawer-highlight {
        top: 64px;
        right: 8px;
        width: 320px;
        height: 500px;
        border-style: dotted; /* slightly different for implied presence */
    }

    /* Cards */
    .tutorial-card {
        position: absolute;
        background: var(--bg-panel);
        border: 1px solid var(--border-color);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
        padding: 16px;
        border-radius: 8px;
        width: 250px;
        color: var(--text-main);
    }

    .tutorial-card h3 {
        margin: 0 0 8px 0;
        font-size: 1rem;
        color: var(--accent-primary);
    }

    .tutorial-card p {
        margin: 0;
        font-size: 0.85rem;
        color: var(--text-muted);
        line-height: 1.4;
    }

    /* Card Positioning Math */
    .top-nav-highlight .tutorial-card.bottom {
        top: 60px;
        left: 50%;
        transform: translateX(-50%);
    }

    .sidebar-highlight .tutorial-card.right {
        top: 50%;
        left: 280px;
        transform: translateY(-50%);
    }

    .canvas-highlight .tutorial-card.center {
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 300px;
        text-align: center;
    }

    .drawer-highlight .tutorial-card.left {
        top: 50%;
        right: 340px;
        transform: translateY(-50%);
    }
</style>
