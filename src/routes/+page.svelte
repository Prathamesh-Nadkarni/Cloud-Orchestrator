<script lang="ts">
  import {
    SvelteFlow,
    Background,
    Controls,
    MarkerType,
    MiniMap,
    type Node,
    type Edge,
    type Connection,
  } from "@xyflow/svelte";
  import "@xyflow/svelte/dist/style.css";
  import Sidebar from "$lib/components/Sidebar.svelte";
  import PropertyDrawer from "$lib/components/PropertyDrawer.svelte";
  import TopNav from "$lib/components/TopNav.svelte";
  import CloudNode from "$lib/components/nodes/CloudNode.svelte";
  import ContextMenu from "$lib/components/ContextMenu.svelte";
  import AttachModal from "$lib/components/AttachModal.svelte";
  import AlertDialog from "$lib/components/AlertDialog.svelte";
  import ConfirmDialog from "$lib/components/ConfirmDialog.svelte";
  import TerraformConverter from "$lib/components/TerraformConverter.svelte";
  import { writable, get } from "svelte/store";

  interface CloudNodeData extends Record<string, unknown> {
    type: string;
    label: string;
    provider: string;
    cidr?: string;
    size?: string;
    disk?: number;
    count?: number;
  }

  type AppNode = Node<CloudNodeData>;
  type AppEdge = Edge;

  // Register custom node shapes
  const nodeTypes = {
    cloud: CloudNode,
    cloudNode: CloudNode,
  };

  // State
  const selectedNode = writable<AppNode | null>(null);
  let nodes = $state<AppNode[]>([]);
  let edges = $state<AppEdge[]>([]);
  let viewport = $state({ x: 0, y: 0, zoom: 1 });

  // Current view toggle
  let currentView = $state("orchestrator");

  // Context Menu State
  let contextMenuOpen = $state(false);
  let contextMenuPos = $state({ x: 0, y: 0 });
  let contextNode = $state<AppNode | null>(null);

  // Attach Modal State
  let attachModalOpen = $state(false);
  let attachSourceNode = $state<AppNode | null>(null);
  let attachAvailableNodes = $derived(
    nodes.filter((n) => attachSourceNode && n.id !== attachSourceNode.id),
  );

  // Alert Dialog State
  let alertOpen = $state(false);
  let alertTitle = $state("");
  let alertMessage = $state("");
  let alertType = $state("warning");

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

  // Confirm state
  let confirmOpen = $state(false);
  let confirmTitle = $state("");
  let confirmMsg = $state("");
  let pendingAction = $state<(() => void) | null>(null);

  function requestConfirm(title: string, msg: string, action: () => void) {
    confirmTitle = title;
    confirmMsg = msg;
    pendingAction = action;
    confirmOpen = true;
  }

  const onNodeClick = ({ node }: { node: AppNode }) => {
    selectedNode.set(node);
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

  // Context Menu Actions
  const handleEdit = (node: AppNode) => {
    selectedNode.set(node);
  };

  const handleDelete = (node: AppNode) => {
    nodes = nodes.filter((n) => n.id !== node.id);
    edges = edges.filter((e) => e.source !== node.id && e.target !== node.id);
    if (get(selectedNode)?.id === node.id) selectedNode.set(null);
  };

  const handleDetach = (node: AppNode) => {
    edges = edges.filter((e) => e.source !== node.id && e.target !== node.id);
  };

  const handleOpenAttach = (node: AppNode) => {
    attachSourceNode = node;
    attachModalOpen = true;
  };

  const saveAttachments = (sourceId: string, targetIds: string[]) => {
    // Remove existing edges connected to source
    edges = edges.filter((e) => e.source !== sourceId && e.target !== sourceId);

    // Add new edges for all selected targets
    const newEdges: AppEdge[] = targetIds.map((targetId) => ({
      id: `edge-${sourceId}-${targetId}-${Date.now()}`,
      source: sourceId,
      target: targetId,
    }));

    edges = [...edges, ...newEdges];
  };

  // Drag and Drop Logic
  const onDragOver = (event: DragEvent) => {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();

    const type = event.dataTransfer?.getData("application/svelteflow");
    const label = event.dataTransfer?.getData("application/label") || "";
    const provider = event.dataTransfer?.getData("application/provider") || "";

    if (!type) return;

    let data: CloudNodeData = { type, label, provider };
    if (type === "compute") {
      const defaultSize =
        provider === "aws"
          ? "t2.micro"
          : provider === "azure"
            ? "Standard_B1s"
            : "e2-micro";
      data = { ...data, size: defaultSize, disk: 20 };
    } else if (type === "subnet" || type === "vpc" || type === "vnet") {
      data = {
        ...data,
        cidr: type === "subnet" ? "10.0.1.0/24" : "10.0.0.0/16",
      };
    } else if (type === "kubernetes") {
      const defaultKtSize =
        provider === "aws"
          ? "t3.medium"
          : provider === "azure"
            ? "Standard_D2s_v3"
            : "e2-medium";
      data = { ...data, size: defaultKtSize, count: 3 };
    }

    const canvasBounds = document
      .querySelector(".canvas-wrapper")
      ?.getBoundingClientRect();
    const offsetX = canvasBounds ? canvasBounds.left : 280;
    const offsetY = canvasBounds ? canvasBounds.top : 64;

    const position = {
      x: (event.clientX - offsetX - viewport.x) / viewport.zoom,
      y: (event.clientY - offsetY - viewport.y) / viewport.zoom,
    };

    // Determine if dropped inside a container
    // Iterate in reverse to grab the topmost container if overlapping
    const parentContainer = [...nodes].reverse().find((n) => {
      if (n.type !== "cloud") return false;

      const isContainerType = [
        "vpc",
        "vnet",
        "securityGroup",
        "networkGroup",
        "kubernetes",
        "k8sNode",
      ].includes(n.data.type);
      if (!isContainerType) return false;

      const width = n.measured?.width || 500;
      const height = n.measured?.height || 400;

      return (
        position.x >= n.position.x &&
        position.x <= n.position.x + width &&
        position.y >= n.position.y &&
        position.y <= n.position.y + height
      );
    });

    let newNode: AppNode = {
      id: `${provider}-${type}-${Date.now()}`,
      type: "cloud",
      position,
      data,
    };

    // Set initial dimensions for containers to enable resizing baseline
    if (["vpc", "vnet"].includes(type)) {
      newNode.width = 800;
      newNode.height = 600;
    } else if (["subnet", "kubernetes"].includes(type)) {
      newNode.width = 450;
      newNode.height = 350;
    } else if (["securityGroup", "networkGroup", "k8sNode"].includes(type)) {
      newNode.width = 250;
      newNode.height = 180;
    }

    let canNest = false;
    if (parentContainer && !["vpc", "vnet"].includes(type)) {
      if (type === "kubernetes") {
        // Exception: allow K8s clusters to be grouped under VPCs of their own provider
        if (
          ["vpc", "vnet"].includes(parentContainer.data.type) &&
          parentContainer.data.provider === provider
        ) {
          canNest = true;
        }
      } else if (provider === "kubernetes") {
        // Exception: allow generic K8s pods/nodes inside clusters or nodes
        if (parentContainer.data.type === "kubernetes") {
          canNest = true;
        } else if (
          parentContainer.data.type === "k8sNode" &&
          type !== "k8sNode"
        ) {
          canNest = true;
        }
      } else if (parentContainer.data.provider === provider) {
        canNest = true;
      }
    }

    if (canNest && type === "subnet" && parentContainer) {
      const existingSubnets = nodes.filter(
        (n) => n.parentId === parentContainer.id && n.data.type === "subnet",
      );
      const cidr = data.cidr as string;
      if (existingSubnets.some((n) => n.data.cidr === cidr)) {
        showAlert(
          "CIDR Overlap",
          `Warning: The dropped Subnet has a CIDR of ${cidr} which overlaps with an existing subnet in this ${parentContainer.data.type.toUpperCase()}. Consider updating the CIDR block settings.`,
        );
      }
    }

    if (!canNest && (type === "kubernetes" || provider === "kubernetes")) {
      let title = "Placement Instructions";
      let msg =
        "Invalid resource placement. Please follow the nesting rules below:";

      if (type === "kubernetes") {
        msg =
          "Kubernetes Clusters (EKS/AKS/GKE) must be placed INSIDE a VPC or VNet belonging to the same provider (e.g., place an EKS Cluster inside an AWS VPC).";
      } else if (type === "k8sNode") {
        msg =
          "Kubernetes Nodes must be placed INSIDE a Kubernetes Cluster container.";
      } else if (type === "k8sPod" || type === "k8sService") {
        msg =
          "Kubernetes Pods and Services must be placed INSIDE a Kubernetes Cluster or a specific K8s Node container.";
      } else if (provider === "kubernetes") {
        msg = "Kubernetes resources must be nested within a Cluster or Node.";
      }

      showAlert(title, msg, "error");
      return;
    }

    const finalizeDrop = () => {
      if (canNest && parentContainer) {
        newNode.parentId = parentContainer.id;
        newNode.position = {
          x: position.x - parentContainer.position.x,
          y: position.y - parentContainer.position.y,
        };
      }
      nodes = [...nodes, newNode];
    };

    if (parentContainer) {
      requestConfirm(
        "Authorize Placement",
        `Place this ${type.toUpperCase()} within ${parentContainer.data.type.toUpperCase()} (${parentContainer.id})?`,
        finalizeDrop,
      );
    } else {
      finalizeDrop();
    }
  };

  const handleNodeDragStop = ({
    event,
    nodes: draggedNodes,
  }: {
    event: MouseEvent | TouchEvent;
    nodes: AppNode[];
  }) => {
    const node = draggedNodes[0];
    if (!node) return;

    // SvelteFlow provides positionAbsolute during drag
    const anyNode = node as any;
    const absX = anyNode.positionAbsolute?.x ?? node.position.x;
    const absY = anyNode.positionAbsolute?.y ?? node.position.y;

    // Helper to calculate a node's true absolute canvas coordinates
    const getAbsolutePos = (n: AppNode) => {
      let x = n.position.x;
      let y = n.position.y;
      let curr = n;
      while (curr.parentId) {
        const parentId: string = curr.parentId;
        const parent = nodes.find((p) => p.id === parentId);
        if (parent) {
          x += parent.position.x;
          y += parent.position.y;
          curr = parent;
        } else break;
      }
      return { x, y };
    };

    const parentContainer = [...nodes].reverse().find((n) => {
      if (n.type !== "cloud" || n.id === node.id) return false;
      const isContainerType = [
        "vpc",
        "vnet",
        "securityGroup",
        "networkGroup",
        "kubernetes",
        "k8sNode",
      ].includes(n.data.type);
      if (!isContainerType) return false;

      const pAbs = getAbsolutePos(n);
      const width = n.measured?.width || 500;
      const height = n.measured?.height || 400;

      const nodeCenterX = absX + (node.measured?.width || 160) / 2;
      const nodeCenterY = absY + (node.measured?.height || 80) / 2;

      return (
        nodeCenterX >= pAbs.x &&
        nodeCenterX <= pAbs.x + width &&
        nodeCenterY >= pAbs.y &&
        nodeCenterY <= pAbs.y + height
      );
    });

    const canBeNested = ["vpc", "vnet"].includes(node.data.type) === false;
    let canNest = false;
    if (parentContainer && canBeNested) {
      if (node.data.type === "kubernetes") {
        if (
          ["vpc", "vnet"].includes(parentContainer.data.type) &&
          parentContainer.data.provider === node.data.provider
        ) {
          canNest = true;
        }
      } else if (node.data.provider === "kubernetes") {
        if (parentContainer.data.type === "kubernetes") {
          canNest = true;
        } else if (
          parentContainer.data.type === "k8sNode" &&
          node.data.type !== "k8sNode"
        ) {
          canNest = true;
        }
      } else if (parentContainer.data.provider === node.data.provider) {
        canNest = true;
      }
    }

    const currentParentId = node.parentId;
    const targetParentId = canNest ? parentContainer?.id : undefined;

    const finalizeMove = () => {
      nodes = nodes.map((n) => {
        if (n.id === node.id) {
          if (canNest && parentContainer) {
            const pAbs = getAbsolutePos(parentContainer);
            return {
              ...n,
              parentId: parentContainer.id,
              position: { x: absX - pAbs.x, y: absY - pAbs.y },
            };
          } else {
            return {
              ...n,
              parentId: undefined,
              position: { x: absX, y: absY },
            };
          }
        }
        return n;
      });
    };

    if (currentParentId !== targetParentId) {
      // Logic for K8s restrictions
      if (
        !canNest &&
        (node.data.type === "kubernetes" || node.data.provider === "kubernetes")
      ) {
        showAlert(
          "Placement Error",
          "Invalid placement. K8s resources must remain nested within their allowed containers.",
          "error",
        );
        return;
      }

      requestConfirm(
        targetParentId ? "Authorize Nesting" : "Authorize Removal",
        targetParentId
          ? `Nest this resource into ${parentContainer?.data.type.toUpperCase()}?`
          : `Remove this resource from its parent container?`,
        finalizeMove,
      );
    } else {
      finalizeMove();
    }
  };

  const handleConnect = (connection: Connection) => {
    const sourceNode = nodes.find((n) => n.id === connection.source);
    const targetNode = nodes.find((n) => n.id === connection.target);

    if (sourceNode && targetNode) {
      const p1 = sourceNode.data.provider;
      const p2 = targetNode.data.provider;

      if (p1 !== p2 && p1 !== "aviatrix" && p2 !== "aviatrix") {
        showAlert(
          "Direct Cross-Cloud Connection Blocked",
          "You cannot connect resources across different Cloud Providers directly. Please use an Aviatrix Transit Backbone to bridge clouds.",
          "error",
        );
        return;
      }
    }

    // Default edge properties for networking
    const edgeData = {
      protocol: "all",
      port: "*",
    };

    edges = [
      ...edges,
      {
        ...connection,
        id: `edge-${Date.now()}`,
        data: edgeData,
        style: "stroke: var(--text-main); stroke-width: 2;",
        markerEnd: { type: MarkerType.ArrowClosed, color: "var(--text-main)" },
        animated: true,
        label: "ALL : *",
        labelStyle:
          "fill: var(--text-main); font-weight: 600; font-size: 12px;",
      },
    ];
  };

  let selectedEdge = $state<Edge | null>(null);

  const onEdgeClick = ({ edge }: { edge: Edge }) => {
    selectedNode.set(null); // Deselect node if edge is clicked
    selectedEdge = edge;
  };

  const onPaneClick = () => {
    selectedNode.set(null);
    selectedEdge = null;
    contextMenuOpen = false;
  };

  const onSelectionChange = ({
    nodes: selectedNodes,
    edges: selectedEdges,
  }: {
    nodes: AppNode[];
    edges: AppEdge[];
  }) => {
    if (selectedNodes.length === 1) {
      selectedNode.set(selectedNodes[0]);
      selectedEdge = null;
    } else if (selectedEdges.length === 1) {
      selectedEdge = selectedEdges[0];
      selectedNode.set(null);
    } else {
      selectedNode.set(null);
      selectedEdge = null;
    }
  };
</script>

<svelte:window
  onkeydown={(e) => {
    const target = e.target as HTMLElement;
    if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA") return;

    if (e.metaKey || e.ctrlKey) {
      if (e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (nodes.length > 0) {
          nodes = nodes.slice(0, -1);
        }
      } else if (e.key.toLowerCase() === "d") {
        e.preventDefault();
        const selected = get(selectedNode);
        if (selected) {
          const newNode = {
            ...selected,
            id: `${selected.data.provider}-${selected.data.type}-${Date.now()}`,
            position: {
              x: selected.position.x + 30,
              y: selected.position.y + 30,
            },
            selected: false,
          };
          nodes = [...nodes, newNode];
        }
      }
    } else if (e.key === "Backspace" || e.key === "Delete") {
      const selected = get(selectedNode);
      if (selected) {
        handleDelete(selected);
      }
    }
  }}
/>

<div class="app-container">
  <TopNav
    bind:nodes
    bind:edges
    bind:currentView
    onSimulationComplete={(newEdges: AppEdge[]) => {
      edges = [...newEdges];
    }}
  />

  {#if currentView === "orchestrator"}
    <div class="workspace">
      <Sidebar />

      <main class="canvas-wrapper" ondragover={onDragOver} ondrop={onDrop}>
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
          onnodedragstop={handleNodeDragStop}
          onconnect={handleConnect}
          colorMode="dark"
          class="glass-panel"
          minZoom={0.05}
          maxZoom={16}
        >
          <Background gap={24} size={2} bgColor="rgba(255, 255, 255, 0.05)" />
          <Controls />
          <MiniMap
            nodeColor="var(--bg-panel-hover)"
            maskColor="rgba(0, 0, 0, 0.5)"
          />
        </SvelteFlow>
      </main>

      <PropertyDrawer
        selectedNode={$selectedNode}
        {selectedEdge}
        bind:nodes
        bind:edges
      />
    </div>
  {:else}
    <div class="workspace">
      <TerraformConverter />
    </div>
  {/if}

  <ContextMenu
    bind:isOpen={contextMenuOpen}
    position={contextMenuPos}
    node={contextNode}
    onEdit={handleEdit}
    onDelete={handleDelete}
    onDetach={handleDetach}
    onAttach={handleOpenAttach}
    onClose={() => (contextMenuOpen = false)}
  />

  <AttachModal
    isOpen={attachModalOpen}
    sourceNode={attachSourceNode}
    availableNodes={attachAvailableNodes}
    existingEdges={edges}
    onClose={() => (attachModalOpen = false)}
    onSave={saveAttachments}
  />

  <AlertDialog
    bind:isOpen={alertOpen}
    title={alertTitle}
    message={alertMessage}
    type={alertType as "warning" | "error" | "info"}
  />

  <ConfirmDialog
    bind:isOpen={confirmOpen}
    title={confirmTitle}
    message={confirmMsg}
    onConfirm={() => pendingAction?.()}
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

  .canvas-wrapper {
    flex: 1;
    height: 100%;
    position: relative;
  }
</style>
