<script>
  import { SvelteFlow, Background, Controls, MarkerType, MiniMap } from '@xyflow/svelte';
  import '@xyflow/svelte/dist/style.css';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import PropertyDrawer from '$lib/components/PropertyDrawer.svelte';
  import TopNav from '$lib/components/TopNav.svelte';
  import CloudNode from '$lib/components/nodes/CloudNode.svelte';
  import ContextMenu from '$lib/components/ContextMenu.svelte';
  import AttachModal from '$lib/components/AttachModal.svelte';
  import { writable, get } from 'svelte/store';

  // Register custom node shapes
  const nodeTypes = {
    cloud: CloudNode
  };

  // State
  const selectedNode = writable(null);
  let nodes = $state([]);
  let edges = $state([]);

  // Context Menu State
  let contextMenuOpen = $state(false);
  let contextMenuPos = $state({ x: 0, y: 0 });
  let contextNode = $state(null);

  // Attach Modal State
  let attachModalOpen = $state(false);
  let attachSourceNode = $state(null);
  let attachAvailableNodes = $derived(
    nodes.filter(n => attachSourceNode && n.id !== attachSourceNode.id)
  );

  const onNodeClick = ({ event, node }) => {
    selectedNode.set(node);
  };


  const onNodeContextMenu = ({ event, node }) => {
    event.preventDefault();
    contextNode = node;
    contextMenuPos = { x: event.clientX, y: event.clientY };
    contextMenuOpen = true;
  };

  // Context Menu Actions
  const handleEdit = (node) => {
    selectedNode.set(node);
  };

  const handleDelete = (node) => {
    nodes = nodes.filter(n => n.id !== node.id);
    edges = edges.filter(e => e.source !== node.id && e.target !== node.id);
    if (get(selectedNode)?.id === node.id) selectedNode.set(null);
  };

  const handleDetach = (node) => {
    edges = edges.filter(e => e.source !== node.id && e.target !== node.id);
  };

  const handleOpenAttach = (node) => {
    attachSourceNode = node;
    attachModalOpen = true;
  };

  const saveAttachments = (sourceId, targetIds) => {
    // Remove existing edges connected to source
    edges = edges.filter(e => e.source !== sourceId && e.target !== sourceId);
    
    // Add new edges for all selected targets
    const newEdges = targetIds.map(targetId => ({
      id: `edge-${sourceId}-${targetId}-${Date.now()}`,
      source: sourceId,
      target: targetId
    }));
    
    edges = [...edges, ...newEdges];
  };

  // Drag and Drop Logic
  const onDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const onDrop = (event) => {
    event.preventDefault();

    const type = event.dataTransfer.getData('application/svelteflow');
    const label = event.dataTransfer.getData('application/label');
    const provider = event.dataTransfer.getData('application/provider');
    
    if (!type) return;

    let data = { type, label, provider };
    if (type === 'compute') {
      const defaultSize = provider === 'aws' ? 't2.micro' : provider === 'azure' ? 'Standard_B1s' : 'e2-micro';
      data = { ...data, size: defaultSize, disk: 20 };
    } else if (type === 'subnet' || type === 'vpc' || type === 'vnet') {
      data = { ...data, cidr: type === 'subnet' ? '10.0.1.0/24' : '10.0.0.0/16' };
    } else if (type === 'kubernetes') {
      const defaultKtSize = provider === 'aws' ? 't3.medium' : provider === 'azure' ? 'Standard_D2s_v3' : 'e2-medium';
      data = { ...data, size: defaultKtSize, count: 3 };
    }

    const position = {
      x: event.clientX - 280,
      y: event.clientY - 64
    };

    // Determine if dropped inside a container
    // Iterate in reverse to grab the topmost container if overlapping
    const parentContainer = [...nodes].reverse().find(n => {
      if (n.type !== 'cloud') return false;
      
      const isContainerType = ['vpc', 'vnet', 'securityGroup', 'networkGroup', 'kubernetes', 'k8sNode'].includes(n.data.type);
      if (!isContainerType) return false;
      
      const width = n.measured?.width || 500;
      const height = n.measured?.height || 400;
      
      return position.x >= n.position.x && position.x <= n.position.x + width &&
             position.y >= n.position.y && position.y <= n.position.y + height;
    });

    let newNode = {
      id: `${provider}-${type}-${Date.now()}`,
      type: 'cloud',
      position,
      data
    };

    let canNest = false;
    if (parentContainer && !['vpc', 'vnet'].includes(type)) {
      if (type === 'kubernetes') {
        // Exception: allow K8s clusters to be grouped under VPCs of their own provider
        if (['vpc', 'vnet'].includes(parentContainer.data.type) && parentContainer.data.provider === provider) {
          canNest = true;
        }
      } else if (provider === 'kubernetes') {
        // Exception: allow generic K8s pods/nodes inside clusters or nodes
        if (parentContainer.data.type === 'kubernetes') {
          canNest = true;
        } else if (parentContainer.data.type === 'k8sNode' && type !== 'k8sNode') {
          canNest = true;
        }
      } else if (parentContainer.data.provider === provider) {
        canNest = true;
      }
    }
    
    if (canNest && type === 'subnet') {
      const existingSubnets = nodes.filter(n => n.parentNode === parentContainer.id && n.data.type === 'subnet');
      if (existingSubnets.some(n => n.data.cidr === data.cidr)) {
        alert(`Warning: The dropped Subnet has a CIDR of ${data.cidr} which overlaps with an existing subnet in this ${parentContainer.data.type.toUpperCase()}. Consider updating the CIDR block in the connection settings.`);
      }
    }

    if (!canNest && (type === 'kubernetes' || provider === 'kubernetes')) {
      alert(`Invalid placement. K8s Clusters must be in VPCs, Nodes in Clusters, and Pods/Services in Nodes/Clusters.`);
      return;
    }

    if (canNest) {
      newNode.parentNode = parentContainer.id;
      // Adjust position relative to parent
      newNode.position = {
        x: position.x - parentContainer.position.x,
        y: position.y - parentContainer.position.y
      };
    }

    nodes = [...nodes, newNode];
  };

  const handleNodeDragStop = ({ event, node }) => {
    if (!node) return;
    
    // SvelteFlow provides positionAbsolute during drag
    const absX = node.positionAbsolute?.x ?? node.position.x;
    const absY = node.positionAbsolute?.y ?? node.position.y;

    // Helper to calculate a node's true absolute canvas coordinates
    const getAbsolutePos = (n) => {
      let x = n.position.x;
      let y = n.position.y;
      let curr = n;
      while (curr.parentNode) {
        curr = nodes.find(p => p.id === curr.parentNode);
        if (curr) {
          x += curr.position.x;
          y += curr.position.y;
        } else break;
      }
      return { x, y };
    };

    const parentContainer = [...nodes].reverse().find(n => {
      if (n.type !== 'cloud' || n.id === node.id) return false;
      const isContainerType = ['vpc', 'vnet', 'securityGroup', 'networkGroup', 'kubernetes', 'k8sNode'].includes(n.data.type);
      if (!isContainerType) return false;
      
      const pAbs = getAbsolutePos(n);
      const width = n.measured?.width || 500;
      const height = n.measured?.height || 400;
      
      const nodeCenterX = absX + (node.measured?.width || 160) / 2;
      const nodeCenterY = absY + (node.measured?.height || 80) / 2;

      return nodeCenterX >= pAbs.x && nodeCenterX <= pAbs.x + width &&
             nodeCenterY >= pAbs.y && nodeCenterY <= pAbs.y + height;
    });

    const canBeNested = ['vpc', 'vnet'].includes(node.data.type) === false;

    nodes = nodes.map(n => {
      if (n.id === node.id) {
        let canNest = false;
        if (parentContainer && canBeNested) {
          if (node.data.type === 'kubernetes') {
            if (['vpc', 'vnet'].includes(parentContainer.data.type) && parentContainer.data.provider === node.data.provider) {
              canNest = true;
            }
          } else if (node.data.provider === 'kubernetes') {
            if (parentContainer.data.type === 'kubernetes') {
              canNest = true;
            } else if (parentContainer.data.type === 'k8sNode' && node.data.type !== 'k8sNode') {
              canNest = true;
            }
          } else if (parentContainer.data.provider === node.data.provider) {
            canNest = true;
          }
        }

        if (canNest) {
          const pAbs = getAbsolutePos(parentContainer);
          return {
            ...n,
            parentNode: parentContainer.id,
            position: { x: absX - pAbs.x, y: absY - pAbs.y }
          };
        } else {
          if (n.data.type === 'kubernetes' || n.data.provider === 'kubernetes') {
             alert(`Invalid placement. K8s resources must remain nested within their allowed containers.`);
             return {
               ...n,
               position: { x: 40, y: 40 } // Snap back safely inside its existing parent
             };
          }
          return {
            ...n,
            parentNode: undefined,
            position: { x: absX, y: absY }
          };
        }
      }
      return n;
    });
  };

  const handleConnect = (connection) => {
    const sourceNode = nodes.find(n => n.id === connection.source);
    const targetNode = nodes.find(n => n.id === connection.target);
    
    if (sourceNode && targetNode) {
      const p1 = sourceNode.data.provider;
      const p2 = targetNode.data.provider;
      
      if (p1 !== p2 && p1 !== 'aviatrix' && p2 !== 'aviatrix') {
        alert('Cannot connect resources across different Cloud Providers directly unless using an Aviatrix transit backbone.');
        return;
      }
    }
    
    // Default edge properties for networking
    const edgeData = {
      protocol: 'all',
      port: '*'
    };
    
    edges = [...edges, { 
      ...connection, 
      id: `edge-${Date.now()}`,
      data: edgeData,
      style: "stroke: var(--text-color); stroke-width: 2;",
      markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--text-color)' },
      animated: true
    }];
  };

  let selectedEdge = $state(null);

  const onEdgeClick = ({ event, edge }) => {
    selectedNode.set(null); // Deselect node if edge is clicked
    selectedEdge = edge;
  };

  const onPaneClick = () => {
    selectedNode.set(null);
    selectedEdge = null;
    contextMenuOpen = false;
  };

  const onSelectionChange = ({ nodes: selectedNodes, edges: selectedEdges }) => {
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

  <svelte:window onkeydown={(e) => {
    if (e.target.tagName?.toLowerCase() === 'input' || e.target.tagName?.toLowerCase() === 'textarea') return;
    
    if (e.metaKey || e.ctrlKey) {
      if (e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (nodes.length > 0) {
          nodes = nodes.slice(0, -1);
        }
      } else if (e.key.toLowerCase() === 'd') {
        e.preventDefault();
        const selected = get(selectedNode);
        if (selected) {
          const newNode = {
            ...selected,
            id: `${selected.data.provider}-${selected.data.type}-${Date.now()}`,
            position: { x: selected.position.x + 30, y: selected.position.y + 30 },
            selected: false
          };
          nodes = [...nodes, newNode];
        }
      }
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
      const selected = get(selectedNode);
      if (selected) {
        handleDelete(selected);
      }
    }
  }} />

<div class="app-container">
  <TopNav {nodes} {edges} />
  
  <div class="workspace">
    <Sidebar />
    
    <main class="canvas-wrapper" ondragover={onDragOver} ondrop={onDrop}>
      <SvelteFlow
        {nodes}
        {edges}
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
      >
        <Background gap={24} size={2} bgColor="rgba(255, 255, 255, 0.05)" />
        <Controls />
        <MiniMap nodeColor="var(--bg-panel-hover)" maskColor="rgba(0, 0, 0, 0.5)" />
      </SvelteFlow>
    </main>

    <PropertyDrawer selectedNode={$selectedNode} {selectedEdge} bind:nodes bind:edges />
  </div>

  <ContextMenu 
    bind:isOpen={contextMenuOpen}
    position={contextMenuPos}
    node={contextNode}
    onEdit={handleEdit}
    onDelete={handleDelete}
    onDetach={handleDetach}
    onAttach={handleOpenAttach}
  />

  <AttachModal
    isOpen={attachModalOpen}
    sourceNode={attachSourceNode}
    availableNodes={attachAvailableNodes}
    existingEdges={edges}
    onClose={() => attachModalOpen = false}
    onSave={saveAttachments}
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
