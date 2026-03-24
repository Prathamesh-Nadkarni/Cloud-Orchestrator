<script lang="ts">
    import {
        SvelteFlow,
        Background,
        Controls,
        MiniMap,
        type Viewport,
        type Connection,
        type Edge,
    } from "@xyflow/svelte";
    import CloudNode from "$lib/components/nodes/CloudNode.svelte";
    import type { AppNode, AppEdge } from "$lib/client/canvas-logic";
    import { globalState } from "$lib/client/state.svelte";

    let {
        nodes = $bindable(),
        edges = $bindable(),
        viewport = $bindable(),
        viewMode = "2d",
        edgeTooltip = $bindable(),
        onNodeClick,
        onEdgeClick,
        onPaneClick,
        onSelectionChange,
        onNodeContextMenu,
        onConnect,
        onNodeDragStop,
        onDrop,
        onDragOver,
    } = $props<{
        nodes: AppNode[];
        edges: AppEdge[];
        viewport: Viewport;
        viewMode?: string;
        edgeTooltip: any;
        onNodeClick: (args: any) => void;
        onEdgeClick: (args: any) => void;
        onPaneClick: () => void;
        onSelectionChange: (args: any) => void;
        onNodeContextMenu: (args: any) => void;
        onConnect: (connection: Connection) => void;
        onNodeDragStop: (args: any) => void;
        onDrop: (event: DragEvent) => void;
        onDragOver: (event: DragEvent) => void;
    }>();

    import VendorNode from "$lib/components/nodes/VendorNode.svelte";

    const nodeTypes = {
        cloud: CloudNode,
        cloudNode: CloudNode,
        vendor: VendorNode,
    };
</script>

<main
    class="canvas-wrapper"
    class:isometric={viewMode === "3d"}
    class:canvas-drop-active={globalState.dragContext !== null && globalState.canDropOnCanvas}
    ondragover={onDragOver}
    ondrop={onDrop}
>
    <SvelteFlow
        bind:nodes
        bind:edges
        bind:viewport
        {nodeTypes}
        fitView
        onnodeclick={onNodeClick}
        onedgeclick={onEdgeClick}
        onpaneclick={onPaneClick}
        onselectionchange={onSelectionChange}
        onnodecontextmenu={onNodeContextMenu}
        onconnect={onConnect}
        onnodedragstop={onNodeDragStop}
        onedgepointerenter={(e) => {
            const edge = e.edge;
            const tooltip = edge?.data?.vulnTooltip;
            if (
                tooltip &&
                typeof tooltip === "string" &&
                tooltip.trim() !== ""
            ) {
                edgeTooltip = {
                    visible: true,
                    x: e.event.clientX,
                    y: e.event.clientY - 20,
                    text: tooltip,
                };
            }
        }}
        onedgepointerleave={() => {
            edgeTooltip = { ...edgeTooltip, visible: false };
        }}
        colorMode="dark"
        class="glass-panel"
        minZoom={0.05}
        maxZoom={16}
    >
        <Background
            gap={24}
            size={2}
            bgColor="#0f1115"
            patternColor="rgba(255, 255, 255, 0.08)"
        />
        <Controls />
        <MiniMap
            nodeColor="var(--bg-panel-hover)"
            maskColor="rgba(0, 0, 0, 0.5)"
        />
    </SvelteFlow>

    {#if edgeTooltip.visible}
        <div
            class="edge-tooltip"
            style="left: {edgeTooltip.x}px; top: {edgeTooltip.y}px;"
        >
            {#each edgeTooltip.text.split("\n") as line}
                <div>{line}</div>
            {/each}
        </div>
    {/if}
</main>

<style>
    .canvas-wrapper {
        flex: 1;
        height: 100%;
        position: relative;
    }

    .canvas-wrapper.isometric {
        overflow: hidden;
        background-color: #0f1115;
    }

    .canvas-wrapper :global(.svelte-flow__container) {
        background: transparent;
    }

    /* 3D Isometric View Styles */
    :global(.isometric .svelte-flow__nodes),
    :global(.isometric .svelte-flow__edges),
    :global(.isometric .svelte-flow__background) {
        transform: scale(2.4) rotateX(55deg) rotateZ(-45deg) !important;
        transform-style: preserve-3d;
        transition: transform 0.6s cubic-bezier(0.25, 0.8, 0.25, 1);
        transform-origin: center center;
    }

    .edge-tooltip {
        position: fixed;
        z-index: 1000;
        background: rgba(15, 17, 21, 0.95);
        border: 1px solid rgba(255, 255, 255, 0.1);
        padding: 8px 12px;
        border-radius: 8px;
        font-size: 12px;
        color: #fff;
        pointer-events: none;
        backdrop-filter: blur(8px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    }

    /* ── Canvas-level drop highlight ── */
    .canvas-drop-active {
        outline: 2px dashed rgba(34, 211, 238, 0.35);
        outline-offset: -4px;
        background-image: radial-gradient(
            circle at center,
            rgba(34, 211, 238, 0.03) 0%,
            transparent 70%
        );
    }
</style>
