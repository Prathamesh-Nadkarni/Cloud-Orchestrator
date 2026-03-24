<script lang="ts">
  import { MarkerType, type Connection } from "@xyflow/svelte";
  import Sidebar from "$lib/components/Sidebar.svelte";
  import PropertyDrawer from "$lib/components/PropertyDrawer.svelte";
  import TopNav from "$lib/components/TopNav.svelte";
  import ContextMenu from "$lib/components/ContextMenu.svelte";
  import AttachModal from "$lib/components/AttachModal.svelte";
  import AlertDialog from "$lib/components/AlertDialog.svelte";
  import ConfirmDialog from "$lib/components/ConfirmDialog.svelte";
  import TerraformConverter from "$lib/components/TerraformConverter.svelte";
  import TutorialOverlay from "$lib/components/TutorialOverlay.svelte";
  import ProductSuggestionPanel from "$lib/components/ProductSuggestionPanel.svelte";
  import Canvas from "$lib/components/canvas/Canvas.svelte";
  import {
    CanvasLogic,
    type AppNode,
    type AppEdge,
    type CloudNodeData,
  } from "$lib/client/canvas-logic";
  import { globalState, clearDragState } from "$lib/client/state.svelte";
  import { SECURITY_VENDORS } from "$lib/blockly/security-vendors";
  import { writable, get } from "svelte/store";

  // State
  const selectedNode = writable<AppNode | null>(null);
  let nodes = $state<AppNode[]>([]);
  let edges = $state<AppEdge[]>([]);
  let showSuggestions = $state(false);
  let showTutorial = $state(false);
  let importedDCF = $state(null);
  let generatedCode = $state("");
  let viewport = $state({ x: 0, y: 0, zoom: 1 });
  let currentView = $state("orchestrator");
  let viewMode = $state("2d");
  let edgeTooltip = $state({ visible: false, x: 0, y: 0, text: "" });

  // Dialog States
  let alertOpen = $state(false);
  let alertTitle = $state("");
  let alertMessage = $state("");
  let alertType = $state("warning");

  let confirmOpen = $state(false);
  let confirmTitle = $state("");
  let confirmMsg = $state("");
  let pendingAction = $state<(() => void) | null>(null);

  // Context & Modal States
  let contextMenuOpen = $state(false);
  let contextMenuPos = $state({ x: 0, y: 0 });
  let contextNode = $state<AppNode | null>(null);
  let attachModalOpen = $state(false);
  let attachSourceNode = $state<AppNode | null>(null);
  let selectedEdge = $state<AppEdge | null>(null);

  function showAlert(
    title: string,
    message: string,
    type: "warning" | "error" | "info" = "warning",
  ) {
    alertTitle = title;
    alertMessage = message;
    alertType = type;
    alertOpen = true;
  }

  function requestConfirm(title: string, msg: string, action: () => void) {
    confirmTitle = title;
    confirmMsg = msg;
    pendingAction = action;
    confirmOpen = true;
  }

  // Handlers
  const onNodeClick = ({ node }: { node: AppNode }) => selectedNode.set(node);
  const onEdgeClick = ({ edge }: { edge: AppEdge }) => {
    selectedNode.set(null);
    selectedEdge = edge;
  };
  const onPaneClick = () => {
    selectedNode.set(null);
    selectedEdge = null;
    contextMenuOpen = false;
  };

  const onSelectionChange = ({
    nodes: sNodes,
    edges: sEdges,
  }: {
    nodes: AppNode[];
    edges: AppEdge[];
  }) => {
    if (sNodes.length === 1) {
      selectedNode.set(sNodes[0]);
      selectedEdge = null;
    } else if (sEdges.length === 1) {
      selectedEdge = sEdges[0];
      selectedNode.set(null);
    } else {
      selectedNode.set(null);
      selectedEdge = null;
    }
  };

  const onNodeContextMenu = ({
    event,
    node,
  }: {
    event: MouseEvent;
    node: AppNode;
  }) => {
    event.preventDefault();
    contextNode = node;
    contextMenuPos = { x: event.clientX, y: event.clientY };
    contextMenuOpen = true;
  };

  const handleConnect = (connection: Connection) => {
    const sourceNode = nodes.find((n) => n.id === connection.source);
    const targetNode = nodes.find((n) => n.id === connection.target);
    if (
      sourceNode &&
      targetNode &&
      sourceNode.data.provider !== targetNode.data.provider &&
      sourceNode.data.provider !== "aviatrix" &&
      targetNode.data.provider !== "aviatrix"
    ) {
      showAlert(
        "Cross-Cloud Blocked",
        "Direct cross-cloud connections require an Aviatrix Transit Backbone.",
        "error",
      );
      return;
    }
    edges = [
      ...edges,
      {
        ...connection,
        id: `edge-${Date.now()}`,
        data: { protocol: "all", port: "*" },
        style: "stroke: var(--text-main); stroke-width: 2;",
        markerEnd: { type: MarkerType.ArrowClosed, color: "var(--text-main)" },
        animated: true,
        label: "ALL : *",
      },
    ];
  };

  // Drag-Over Highlighting
  let _dropTargetFrame: number | null = null;

  function computeValidDropTargets() {
    const ctx = globalState.dragContext;
    if (!ctx) {
      globalState.validDropTargets = [];
      globalState.canDropOnCanvas = false;
      return;
    }
    const { type, provider } = ctx;

    // VPCs/VNets can never nest — they always drop on canvas
    if (["vpc", "vnet"].includes(type)) {
      globalState.validDropTargets = [];
      globalState.canDropOnCanvas = true;
      return;
    }

    const containerTypes = ["vpc", "vnet", "securityGroup", "networkGroup", "kubernetes", "k8sNode", "subnet"];

    // For vendor-integration products, use the hierarchy metadata
    if (type === "vendor-integration") {
      const vendorDef = (SECURITY_VENDORS as Record<string, any>)[provider];
      const hierarchy = vendorDef?.hierarchy;

      if (hierarchy?.placement === "inside_vpc" && hierarchy.nestsInside) {
        // Highlight containers matching nestsInside types
        const validTypes: string[] = hierarchy.nestsInside;
        const valid: string[] = [];
        for (const n of nodes) {
          if (n.type !== "cloud") continue;
          if (validTypes.includes(n.data.type)) {
            valid.push(n.id);
          }
        }
        globalState.validDropTargets = valid;
        globalState.canDropOnCanvas = false;
        return;
      }

      // External vendor products — drop on canvas only
      globalState.validDropTargets = [];
      globalState.canDropOnCanvas = true;
      return;
    }

    // Standard cloud resources — use existing nesting rules
    const valid: string[] = [];
    for (const n of nodes) {
      if (n.type !== "cloud" || !containerTypes.includes(n.data.type)) continue;
      if (CanvasLogic.canNestResource(n, type, provider)) {
        valid.push(n.id);
      }
    }

    globalState.validDropTargets = valid;
    // Can always drop on canvas (it becomes a root-level node)
    globalState.canDropOnCanvas = true;
  }

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    // Throttle the computation to once per animation frame
    if (_dropTargetFrame) return;
    _dropTargetFrame = requestAnimationFrame(() => {
      computeValidDropTargets();
      _dropTargetFrame = null;
    });
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    clearDragState();
    const type = event.dataTransfer?.getData("application/svelteflow");
    const provider = event.dataTransfer?.getData("application/provider") || "";
    if (!type) return;

    const canvasBounds = document
      .querySelector(".canvas-wrapper")
      ?.getBoundingClientRect();
    const position = {
      x:
        (event.clientX - (canvasBounds?.left || 280) - viewport.x) /
        viewport.zoom,
      y:
        (event.clientY - (canvasBounds?.top || 64) - viewport.y) /
        viewport.zoom,
    };

    const parent = CanvasLogic.findParentContainer(nodes, position);
    const canNest = parent
      ? CanvasLogic.canNestResource(parent, type, provider)
      : false;

    if (parent && !canNest) {
      showAlert(
        "Placement Error",
        `${type.toUpperCase()} cannot be nested inside ${parent.data.type.toUpperCase()}. Check hierarchy rules.`,
        "error",
      );
      return;
    }

    const newNode: AppNode = {
      id: `${provider}-${type}-${Date.now()}`,
      type: "cloud",
      position: parent
        ? {
            x: position.x - CanvasLogic.getAbsolutePos(parent, nodes).x,
            y: position.y - CanvasLogic.getAbsolutePos(parent, nodes).y,
          }
        : position,
      parentId: parent?.id,
      data: {
        type,
        provider,
        label: event.dataTransfer?.getData("application/label") || "",
      },
    };

    if (parent)
      requestConfirm(
        "Confirm Placement",
        `Place inside ${parent.id}?`,
        () => (nodes = [...nodes, newNode]),
      );
    else nodes = [...nodes, newNode];
  };

  const handleNodeDragStop = ({
    nodes: draggedNodes,
  }: {
    nodes: AppNode[];
  }) => {
    const node = draggedNodes[0];
    if (!node) return;
    const abs = (node as any).positionAbsolute || node.position;
    const parent = CanvasLogic.findParentContainer(
      nodes,
      { x: abs.x + 80, y: abs.y + 40 },
      node.id,
    );
    const canNest = parent
      ? CanvasLogic.canNestResource(parent, node.data.type, node.data.provider)
      : false;

    if (node.parentId !== parent?.id) {
      if (parent && !canNest) {
        showAlert("Placement Error", "Invalid nesting.", "error");
        return;
      }
      requestConfirm(
        "Confirm Move",
        parent ? "Nest resource?" : "Remove from parent?",
        () => {
          nodes = nodes.map((n) =>
            n.id === node.id
              ? {
                  ...n,
                  parentId: parent?.id,
                  position: parent
                    ? {
                        x: abs.x - CanvasLogic.getAbsolutePos(parent, nodes).x,
                        y: abs.y - CanvasLogic.getAbsolutePos(parent, nodes).y,
                      }
                    : abs,
                }
              : n,
          );
        },
      );
    }
  };

  // Deployment Logic
  async function handleDeploy() {
    showAlert(
      "Deploying",
      "Evaluation policy engine and submitting to execution worker...",
      "info",
    );
    const res = await fetch("/api/orchestrate", {
      method: "POST",
      body: JSON.stringify({
        connectionId: "mock-id",
        graph: { nodes, edges },
      }),
    });
    const result = await res.json();
    if (result.status === "BLOCKED_BY_POLICY") {
      showAlert("Blocked by Policy", result.findings.join("\n"), "error");
    } else if (result.status === "MFA_PENDING") {
      showAlert(
        "MFA Required",
        "Security policy requires step-up authentication. Redirecting...",
        "info",
      );
      // In prod: navigate to verification page
    } else {
      showAlert("Success", "Orchestration queued successfully.", "info");
    }
  }

  // Product Suggestion Handler
  function handleApplySuggestion(newNode: AppNode) {
    nodes = [...nodes, newNode];
    showAlert("Product Added", `${newNode.data.label} has been added to your architecture.`, "info");
  }

  // Intelligence Overlays
  $effect(() => {
    const interval = setInterval(async () => {
      if (nodes.length > 0) {
        const res = await fetch(
          "/api/intelligence/overlay?connectionId=mock-id",
        );
        const { overlay } = await res.json();
        // In prod: Apply overlay data to node/edge state
        console.log("Visual Overlays Updated", overlay);
      }
    }, 10000);
    return () => clearInterval(interval);
  });
</script>

<div class="app-container">
  <TopNav
    bind:nodes
    bind:edges
    bind:currentView
    bind:viewMode
    bind:showTutorial
    bind:showSuggestions
    onDeploy={handleDeploy}
  />

  {#if currentView === "orchestrator"}
    <div class="workspace">
      <Sidebar />
      <Canvas
        bind:nodes
        bind:edges
        bind:viewport
        {viewMode}
        bind:edgeTooltip
        {onNodeClick}
        {onEdgeClick}
        {onPaneClick}
        {onSelectionChange}
        {onNodeContextMenu}
        onConnect={handleConnect}
        onNodeDragStop={handleNodeDragStop}
        {onDrop}
        onDragOver={handleDragOver}
      />
      <PropertyDrawer
        selectedNode={$selectedNode}
        {selectedEdge}
        bind:nodes
        bind:edges
      />
    </div>
  {:else}
    <div class="workspace">
      <TerraformConverter bind:importedDCF {generatedCode} />
    </div>
  {/if}

  <ContextMenu
    bind:isOpen={contextMenuOpen}
    position={contextMenuPos}
    node={contextNode}
    onClose={() => (contextMenuOpen = false)}
  />

  <AttachModal
    isOpen={attachModalOpen}
    sourceNode={attachSourceNode}
    availableNodes={nodes.filter((n) => n.id !== attachSourceNode?.id)}
    existingEdges={edges}
    onClose={() => (attachModalOpen = false)}
    onSave={(sourceId: string, targetIds: string[]) => {
      edges = edges.filter(
        (e) => e.source !== sourceId && e.target !== sourceId,
      );
      edges = [
        ...edges,
        ...targetIds.map((t: string) => ({
          id: `edge-${Date.now()}`,
          source: sourceId,
          target: t,
        })),
      ];
    }}
  />

  <AlertDialog
    bind:isOpen={alertOpen}
    title={alertTitle}
    message={alertMessage}
    type={alertType as any}
  />

  <ConfirmDialog
    bind:isOpen={confirmOpen}
    title={confirmTitle}
    message={confirmMsg}
    onConfirm={() => {
      pendingAction?.();
      confirmOpen = false;
    }}
  />

  <TutorialOverlay
    isOpen={showTutorial}
    onClose={() => (showTutorial = false)}
  />

  <ProductSuggestionPanel
    bind:isOpen={showSuggestions}
    nodes={nodes}
    edges={edges}
    onApply={handleApplySuggestion}
  />
</div>

<style>
  .app-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100vw;
  }
  .workspace {
    display: flex;
    flex: 1;
    overflow: hidden;
    position: relative;
  }

  /* ================== RESOURCE NODES — Tall 3D Block ================== */
  .isometric :global(.resource-node) {
    border: 1px solid rgba(255, 255, 255, 0.35) !important;
    background: rgba(28, 32, 40, 0.97) !important;
    box-shadow:
      0 20px 40px -10px rgba(0, 0, 0, 0.7),
      inset 0 1px 0 rgba(255, 255, 255, 0.15) !important;
  }

  /* Left wall — tall extrusion (skewY creates the visible side face) */
  .isometric :global(.resource-node::before) {
    top: 20px;
    left: -20px;
    width: 20px;
    height: 100%;
    background: linear-gradient(
      to right,
      rgba(12, 14, 18, 0.98),
      rgba(22, 26, 32, 0.95)
    );
    transform: skewY(-45deg);
    border-left: 1px solid rgba(255, 255, 255, 0.12);
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }

  /* Bottom floor — tall extrusion (skewX creates the visible bottom face) */
  .isometric :global(.resource-node::after) {
    bottom: -20px;
    left: -20px;
    width: 100%;
    height: 20px;
    background: linear-gradient(
      to top,
      rgba(8, 10, 14, 0.98),
      rgba(18, 22, 28, 0.95)
    );
    transform: skewX(-45deg);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    border-left: 1px solid rgba(255, 255, 255, 0.06);
  }

  /* Hover lift for resource blocks */
  .isometric :global(.resource-node:hover) {
    box-shadow:
      0 28px 55px -10px rgba(0, 0, 0, 0.8),
      inset 0 1px 0 rgba(255, 255, 255, 0.2) !important;
  }

  /* ================== CONTAINER NODES — Thin Flat Pad ================== */
  .isometric :global(.container-node) {
    background: rgba(16, 19, 24, 0.75) !important;
    border: 2px solid var(--node-accent) !important;
    box-shadow:
      0 8px 20px rgba(0, 0, 0, 0.5),
      inset 0 1px 0 rgba(255, 255, 255, 0.05) !important;
  }

  /* Left wall — thin pad extrusion */
  .isometric :global(.container-node::before) {
    top: 8px;
    left: -8px;
    width: 8px;
    height: 100%;
    background: linear-gradient(
      to right,
      rgba(8, 10, 14, 0.95),
      rgba(14, 17, 22, 0.9)
    );
    transform: skewY(-45deg);
    border-left: 2px solid
      color-mix(in srgb, var(--node-accent) 50%, transparent);
  }

  /* Bottom floor — thin pad extrusion */
  .isometric :global(.container-node::after) {
    bottom: -8px;
    left: -8px;
    width: 100%;
    height: 8px;
    background: linear-gradient(
      to top,
      rgba(6, 8, 12, 0.95),
      rgba(12, 15, 20, 0.9)
    );
    transform: skewX(-45deg);
    border-bottom: 2px solid
      color-mix(in srgb, var(--node-accent) 40%, transparent);
  }

  /* ---- Hide any SvelteFlow native edge labels (we use custom tooltip) ---- */
  :global(.svelte-flow__edge-textbg),
  :global(.svelte-flow__edge-text) {
    display: none !important;
  }

  /* ---- Custom edge hover tooltip ---- */
  .edge-tooltip {
    position: fixed;
    z-index: 10000;
    background: rgba(15, 17, 21, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 8px;
    padding: 8px 14px;
    color: #fff;
    font-size: 12px;
    font-weight: 600;
    line-height: 1.6;
    max-width: 360px;
    pointer-events: none;
    transform: translate(-50%, -100%);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(8px);
  }
</style>
