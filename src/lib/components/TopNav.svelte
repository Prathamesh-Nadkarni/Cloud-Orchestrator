<script lang="ts">
  import {
    Network,
    Play,
    Download,
    Copy,
    Check,
    Save,
    Upload,
    FileUp,
    FileDown,
    Image,
    LayoutTemplate,
    ChevronRight,
    AlertTriangle,
    Shield,
    Box,
    HelpCircle,
    FileCode,
    Terminal,
    History,
    ShieldAlert,
    Sparkles,
  } from "lucide-svelte";
  import { toPng } from "html-to-image";
  import { fade } from "svelte/transition";
  import CostBreakdown from "./CostBreakdown.svelte";
  import DiagramListModal from "./DiagramListModal.svelte";
  import VersionHistoryModal from "./VersionHistoryModal.svelte";
  import TerraformEditor from "./TerraformEditor.svelte";
  import DeploymentModal from "./DeploymentModal.svelte";
  import {
    simulateDataFlow,
    type Vulnerability,
    type SimulationResult,
    type ImportedDCF,
  } from "$lib/utils/securitySimulator";
  import { parseCanvas } from "$lib/generators/index.js";
  import { parseHclToDiagram } from "$lib/utils/hclParser";
  import MarketplaceModal from "./MarketplaceModal.svelte";
  import AdminReviewModal from "./AdminReviewModal.svelte";
  import FirewallManager from "./security/FirewallManager.svelte";
  import { ShoppingBag, Settings, Terminal as TerminalIcon, ShieldCheck } from "lucide-svelte";
  import { globalState, toggleDCFMode } from "$lib/client/state.svelte";

  let {
    nodes = $bindable(),
    edges = $bindable(),
    currentView = $bindable(),
    viewMode = $bindable("2d"),
    showTutorial = $bindable(false),
    showSuggestions = $bindable(false),
    importedDCF = $bindable<ImportedDCF | null>(null),
    generatedCode = $bindable(""),
    onSimulationComplete = () => {},
    onDeploy = () => {},
  } = $props();

  let currentDiagramId = $state<string | null>(null);
  let currentVersionId = $state<string | null>(null);
  let diagramName = $state("Untitled Diagram");
  let showLoadModal = $state(false);
  let showHistoryModal = $state(false);
  let showDeploymentModal = $state(false);
  let showMarketplaceModal = $state(false);
  let showAdminModal = $state(false);
  let showFirewallManager = $state(false);
  let showDCFDropdown = $state(false);
  let isGenerating = $state(false);

  $effect(() => {
    globalState.currentDiagramId = currentDiagramId;
  });

  // Sync Tracking
  let lastSavedSnapshot = $state("");
  let lastSavedTerraform = $state("");
  let lastSavedK8s = $state("");

  let syncStatus = $derived.by(() => {
    if (!currentDiagramId) return "UNSAVED";
    const diagramDiverged =
      lastSavedSnapshot !== JSON.stringify({ nodes, edges });
    const codeDiverged =
      generatedCode !== lastSavedTerraform || generatedK8s !== lastSavedK8s;

    if (diagramDiverged || codeDiverged) return "DIVERGED";
    return "SYNCED";
  });
  let showResult = $state(false);
  let generatedK8s = $state("");
  let activeTab = $state("terraform");
  let copied = $state(false);
  let showCostBreakdown = $state(false);

  // Security Simulation State
  let simulationResult: SimulationResult | null = $state(null);
  let estimatedCost = $derived(
    nodes.reduce((acc: number, node: any) => {
      let nodeCost = 0;
      if (node.data.type === "compute" || node.data.type === "kubernetes") {
        if (node.data.size?.includes("micro")) nodeCost += 8;
        else if (node.data.size?.includes("small")) nodeCost += 16;
        else if (node.data.size?.includes("medium")) nodeCost += 32;
        else if (node.data.size?.includes("large")) nodeCost += 64;
        else if (node.data.size?.includes("xlarge")) nodeCost += 128;
        else nodeCost += 20;

        if (node.data.type === "kubernetes") {
          nodeCost = nodeCost * (node.data.count || 3);
          nodeCost += 73; // Control plane flat fee
        }
      }

      if (node.data.disk) {
        nodeCost += node.data.disk * 0.1; // $0.10 / GB
      }

      return acc + nodeCost;
    }, 0),
  );

  async function handleGenerate() {
    isGenerating = true;
    try {
      // Flag isolated nodes that are disconnected from all networks (ignoring structural containers)
      let hasIsolatedNodes = false;
      nodes = nodes.map((node: any) => {
        const isConnected = edges.some(
          (e: any) => e.source === node.id || e.target === node.id,
        );
        const isContainer = [
          "vpc",
          "vnet",
          "subnet",
          "kubernetes",
          "region",
        ].includes(node.data?.type);
        const isIsolated = !isConnected && !isContainer;

        if (isIsolated) hasIsolatedNodes = true;

        return {
          ...node,
          data: { ...node.data, isolated: isIsolated },
        };
      });

      // Fetch normalized security rules if a diagram exists
      let normalizedRules = null;
      if (currentDiagramId) {
        try {
          const res = await fetch(`/api/security/policies/${currentDiagramId}`);
          const policyData = await res.json();
          normalizedRules = policyData.sortedRules;
        } catch (e) {
          console.error("Failed to fetch security policy for generation", e);
        }
      }

      // Run data flow simulation
      simulationResult = simulateDataFlow(
        nodes,
        edges,
        importedDCF || undefined,
        normalizedRules || undefined
      );

      // Highlight edges dynamically based on simulation result
      edges = edges.map((edge: any) => {
        const edgeVulns = simulationResult!.vulnerabilities.filter(
          (v) => v.edgeId === edge.id,
        );
        const isVulnerable = edgeVulns.some(
          (v) => v.severity === "high" || v.severity === "medium",
        );
        const isSimulated = simulationResult!.simulatedEdges.includes(edge.id);
        const isBlocked = simulationResult!.blockedEdges.includes(edge.id);

        // Build tooltip text from vulnerability titles
        const vulnLabels = edgeVulns.map((v) => v.title).join("\\n");
        let baseStrokeWidth = 2;
        let dashArray = "none";

        if (edge.data?.expectedBandwidthMbps) {
          const bw = edge.data.expectedBandwidthMbps;
          if (bw > 20000) baseStrokeWidth = 6;
          else if (bw > 5000) baseStrokeWidth = 4;
          else if (bw > 1000) baseStrokeWidth = 3;
        }

        if (edge.data?.trafficPattern === "bursty") {
          dashArray = "10 5";
        }

        if (isBlocked) {
          const blockedVuln = edgeVulns.find(
            (v) => v.severity === "low" || v.severity === "blocked",
          );
          return {
            ...edge,
            data: {
              ...edge.data,
              vulnTooltip: blockedVuln
                ? `🛡 ${blockedVuln.title}`
                : "🛡 Blocked by DCF",
            },
            style: `stroke: #ea580c; stroke-width: ${Math.max(3, baseStrokeWidth)}px; filter: drop-shadow(0 0 5px rgba(234, 88, 12, 0.8)); stroke-dasharray: 5 5;`,
            animated: false,
          };
        } else if (isVulnerable) {
          return {
            ...edge,
            data: { ...edge.data, vulnTooltip: `⚠ ${vulnLabels}` },
            style: `stroke: #ff4444; stroke-width: ${Math.max(3, baseStrokeWidth)}px; filter: drop-shadow(0 0 5px rgba(255, 68, 68, 0.8)); stroke-dasharray: ${dashArray};`,
            animated: true,
          };
        } else if (isSimulated) {
          return {
            ...edge,
            data: { ...edge.data, vulnTooltip: "✓ Secure" },
            style: `stroke: #10b981; stroke-width: ${Math.max(3, baseStrokeWidth)}px; filter: drop-shadow(0 0 5px rgba(16, 185, 129, 0.8)); stroke-dasharray: ${dashArray};`,
            animated: true,
          };
        } else {
          return {
            ...edge,
            data: { ...edge.data, vulnTooltip: "" },
            style: `stroke: var(--text-main); stroke-width: ${baseStrokeWidth}px; stroke-dasharray: ${dashArray};`,
            animated: false,
          };
        }
      });

      if (onSimulationComplete) {
        onSimulationComplete(edges);
      }

      const data = parseCanvas(nodes, edges, importedDCF, normalizedRules);

      if (data.terraform || data.kubernetes) {
        generatedCode = data.terraform || "";
        generatedK8s = data.kubernetes || "";
        activeTab = data.hasK8sOnly ? "kubernetes" : "terraform";
        showResult = true;
      } else {
        alert("Failed to generate code.");
      }
    } catch (err) {
      alert("Error generating manifests.");
    } finally {
      isGenerating = false;
    }
  }

  function closeResult() {
    showResult = false;
    copied = false;
  }

  async function handleSaveTerraform(
    newCode: string,
    type: string,
    syncBack = false,
  ) {
    if (!currentDiagramId) {
      alert("Save the diagram first to enable cloud persistence.");
      return;
    }

    try {
      if (syncBack && type === "terraform") {
        if (
          confirm(
            "This will overwrite your current visual diagram with resources parsed from the manual Terraform edits. Continue?",
          )
        ) {
          const parsed = parseHclToDiagram(newCode);
          nodes = parsed.nodes;
          edges = parsed.edges;
        } else {
          return;
        }
      }

      const res = await fetch("/api/diagrams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: currentDiagramId,
          sourceMode: "TERRAFORM",
          manualTerraform: type === "terraform" ? newCode : generatedCode,
          manualK8s: type === "kubernetes" ? newCode : generatedK8s,
          topologySnapshot: { nodes, edges },
          resourceConfig: {},
        }),
      });
      const result = await res.json();
      if (result.success) {
        if (type === "terraform") {
          generatedCode = newCode;
          lastSavedTerraform = newCode;
        } else {
          generatedK8s = newCode;
          lastSavedK8s = newCode;
        }
        lastSavedSnapshot = JSON.stringify({ nodes, edges });
        alert(
          syncBack
            ? "Divergence resolved! Diagram synced with manual overrides."
            : "Terraform overrides persisted to cloud!",
        );
      } else {
        alert("Manual save failed: " + result.error);
      }
    } catch (err) {
      alert("Error during sync/save.");
      console.error(err);
    }
  }

  function copyCode() {
    navigator.clipboard.writeText(
      activeTab === "terraform" ? generatedCode : generatedK8s,
    );
    copied = true;
    setTimeout(() => (copied = false), 2000);
  }

  function downloadCode() {
    const code = activeTab === "terraform" ? generatedCode : generatedK8s;
    const filename = activeTab === "terraform" ? "main.tf" : "k8s.yaml";
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function saveLayout() {
    try {
      const res = await fetch("/api/diagrams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: currentDiagramId,
          name: diagramName,
          topologySnapshot: { nodes, edges },
          resourceConfig: {},
          providers: Array.from(
            new Set(nodes.map((n: any) => n.data.provider)),
          ),
        }),
      });
      const result = await res.json();
      if (result.success) {
        if (result.diagram) currentDiagramId = result.diagram.id;
        lastSavedSnapshot = JSON.stringify({ nodes, edges });
        alert("Diagram saved successfully to cloud!");
      } else {
        alert("Save failed: " + result.error);
      }
    } catch (err) {
      alert("Network error during save.");
    }
  }

  async function handleSelectDiagram(diagram: any) {
    try {
      const res = await fetch(`/api/diagrams/${diagram.id}`);
      const data = await res.json();
      if (data.diagram) {
        currentDiagramId = data.diagram.id;
        diagramName = data.diagram.name;
        // The service stores { nodes, edges } inside topologySnapshot
        nodes = data.diagram.topologySnapshot.nodes || [];
        edges = data.diagram.topologySnapshot.edges || [];
        lastSavedSnapshot = JSON.stringify({ nodes, edges });

        // Load the actual latest files if available
        if (data.latestFiles) {
          const tfFile = data.latestFiles.find(
            (f: any) => f.path === "main.tf",
          );
          const k8sFile = data.latestFiles.find(
            (f: any) => f.path === "kubernetes.yaml",
          );
          if (tfFile) {
            generatedCode = tfFile.content;
            lastSavedTerraform = tfFile.content;
          }
          if (k8sFile) {
            generatedK8s = k8sFile.content;
            lastSavedK8s = k8sFile.content;
          }
        }
      } else {
        alert("Failed to load diagram: " + data.error);
      }
    } catch (err) {
      alert("Network error loading diagram.");
    }
  }

  function exportLayout() {
    const layout = JSON.stringify({ nodes, edges }, null, 2);
    const blob = new Blob([layout], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "architecture.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function importLayout(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const layout = JSON.parse((e.target as any).result);
        nodes = layout.nodes || [];
        edges = layout.edges || [];
      } catch (err) {
        alert("Failed to import layout: Invalid JSON.");
      }
      event.target.value = null;
    };
    reader.readAsText(file);
  }

  function importTerraform(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const newNodes: any[] = [];
        const newEdges: any[] = [];
        let xPos = 100;
        let yPos = 100;

        // Parse resource blocks: resource "type" "name" {}
        const resourceRegex =
          /resource\s+"([^"]+)"\s+"([^"]+)"\s*\{([^}]*)\}/gs;
        let match;
        while ((match = resourceRegex.exec(content)) !== null) {
          const [, resourceType, resourceName, body] = match;
          let nodeType = "compute";
          let provider = "aws";
          let label = resourceName;

          if (resourceType.startsWith("aws_")) provider = "aws";
          else if (resourceType.startsWith("azurerm_")) provider = "azure";
          else if (resourceType.startsWith("google_")) provider = "gcp";

          if (
            resourceType.includes("vpc") ||
            resourceType.includes("virtual_network")
          )
            nodeType = "vpc";
          else if (resourceType.includes("subnet")) nodeType = "subnet";
          else if (
            resourceType.includes("instance") ||
            resourceType.includes("vm")
          )
            nodeType = "compute";
          else if (
            resourceType.includes("db") ||
            resourceType.includes("sql") ||
            resourceType.includes("rds")
          )
            nodeType = "database";
          else if (
            resourceType.includes("security_group") ||
            resourceType.includes("firewall")
          )
            nodeType = "securityGroup";
          else if (
            resourceType.includes("kubernetes") ||
            resourceType.includes("eks") ||
            resourceType.includes("aks") ||
            resourceType.includes("gke")
          )
            nodeType = "kubernetes";
          else if (
            resourceType.includes("storage") ||
            resourceType.includes("s3") ||
            resourceType.includes("blob")
          )
            nodeType = "storage";
          else if (
            resourceType.includes("load_balancer") ||
            resourceType.includes("lb")
          )
            nodeType = "loadBalancer";

          if (provider === "azure" && nodeType === "vpc") nodeType = "vnet";

          // Extract CIDR from body if present
          let cidr: string | undefined;
          const cidrMatch =
            body.match(/cidr_block\s*=\s*"([^"]+)"/) ||
            body.match(/address_space\s*=\s*\["([^"]+)"\]/) ||
            body.match(/ip_cidr_range\s*=\s*"([^"]+)"/);
          if (cidrMatch) cidr = cidrMatch[1];

          // Extract instance type if present
          let size: string | undefined;
          const sizeMatch =
            body.match(/instance_type\s*=\s*"([^"]+)"/) ||
            body.match(/vm_size\s*=\s*"([^"]+)"/) ||
            body.match(/machine_type\s*=\s*"([^"]+)"/);
          if (sizeMatch) size = sizeMatch[1];

          const nodeData: any = {
            type: nodeType,
            label: resourceName,
            provider,
            name: resourceName,
          };
          if (cidr) nodeData.cidr = cidr;
          if (size) nodeData.size = size;

          newNodes.push({
            id: `tf-${resourceName}-${Date.now()}-${newNodes.length}`,
            type: "cloud",
            position: { x: xPos, y: yPos },
            data: nodeData,
          });

          xPos += 250;
          if (xPos > 900) {
            xPos = 100;
            yPos += 200;
          }
        }

        if (newNodes.length === 0) {
          alert("No resource blocks found in this .tf file.");
        } else {
          nodes = newNodes;
          edges = newEdges;
          alert(`Imported ${newNodes.length} resources from Terraform file.`);
        }
      } catch (err) {
        alert("Failed to parse Terraform file.");
        console.error(err);
      }
      (event.target as HTMLInputElement).value = "";
    };
    reader.readAsText(file);
  }

  async function handleJSONPolicyUpload(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file || !currentDiagramId) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const uploadData = JSON.parse(content);
        const policies = uploadData.policies || uploadData.rules || [];
        
        // POST each rule to the backend
        let successCount = 0;
        for (const rule of policies) {
          const res = await fetch(`/api/security/policies/${currentDiagramId}/rules`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(rule)
          });
          if (res.ok) successCount++;
        }
        
        alert(`Successfully imported ${successCount} policies to the diagram.`);
      } catch (err) {
        alert("Failed to parse or upload JSON policies.");
        console.error(err);
      }
      (event.target as HTMLInputElement).value = "";
    };
    reader.readAsText(file);
  }

  function downloadImage() {
    const target = document.querySelector(".svelte-flow") as HTMLElement;
    if (!target) return;
    toPng(target, { backgroundColor: "#0f1115" })
      .then((dataUrl) => {
        const a = document.createElement("a");
        a.download = "infrastructure-diagram.png";
        a.href = dataUrl;
        a.click();
      })
      .catch((err) => {
        console.error("Failed to export image", err);
        alert("Failed to export PNG.");
      });
  }

  function loadTemplate() {
    if (
      confirm(
        "Load 3-Tier Web App template? This will replace your current canvas setup.",
      )
    ) {
      nodes = [
        {
          id: "aws-vpc-1",
          type: "cloud",
          position: { x: 200, y: 150 },
          data: {
            provider: "aws",
            type: "vpc",
            label: "Production VPC",
            cidr: "10.0.0.0/16",
          },
        },
        {
          id: "external-internet-1",
          type: "cloud",
          position: { x: 450, y: -20 },
          data: {
            provider: "external",
            type: "internet",
            label: "Internet (0.0.0.0/0)",
          },
        },

        {
          id: "aws-subnet-1",
          type: "cloud",
          position: { x: 40, y: 80 },
          data: {
            provider: "aws",
            type: "subnet",
            label: "Public Subnet",
            cidr: "10.0.1.0/24",
          },
          parentId: "aws-vpc-1",
        },
        {
          id: "aws-subnet-2",
          type: "cloud",
          position: { x: 300, y: 80 },
          data: {
            provider: "aws",
            type: "subnet",
            label: "Private Subnet",
            cidr: "10.0.2.0/24",
          },
          parentId: "aws-vpc-1",
        },
        {
          id: "aws-subnet-3",
          type: "cloud",
          position: { x: 560, y: 80 },
          data: {
            provider: "aws",
            type: "subnet",
            label: "Data Subnet",
            cidr: "10.0.3.0/24",
          },
          parentId: "aws-vpc-1",
        },

        {
          id: "aws-compute-1",
          type: "cloud",
          position: { x: 20, y: 80 },
          data: {
            provider: "aws",
            type: "compute",
            label: "Web Server",
            size: "t3.small",
          },
          parentId: "aws-subnet-1",
        },
        {
          id: "aws-compute-2",
          type: "cloud",
          position: { x: 20, y: 80 },
          data: {
            provider: "aws",
            type: "compute",
            label: "App Server",
            size: "t3.large",
          },
          parentId: "aws-subnet-2",
        },
        {
          id: "aws-storage-1",
          type: "cloud",
          position: { x: 20, y: 80 },
          data: { provider: "aws", type: "storage", label: "RDS Database" },
          parentId: "aws-subnet-3",
        },
      ];
      edges = [
        {
          id: "edge-1",
          source: "external-internet-1",
          target: "aws-compute-1",
          data: { protocol: "https", port: "443" },
          style: "stroke: #10b981; stroke-width: 2;",
          animated: true,
        },
        {
          id: "edge-2",
          source: "aws-compute-1",
          target: "aws-compute-2",
          data: { protocol: "tcp", port: "8080" },
          style: "stroke: #f59e0b; stroke-width: 2;",
          animated: true,
        },
        {
          id: "edge-3",
          source: "aws-compute-2",
          target: "aws-storage-1",
          data: { protocol: "tcp", port: "3306" },
          style: "stroke: #f59e0b; stroke-width: 2;",
          animated: true,
        },
      ];
    }
  }
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      closeResult();
    }
  }
</script>


<svelte:window onkeydown={handleKeydown} />

<nav class="top-nav glass-panel">
  <div class="brand">
    <div class="logo-icon">
      <Network size={20} color="var(--accent-primary)" />
    </div>

    <select class="view-selector title-dropdown" bind:value={currentView}>
      <option value="orchestrator">Cloud Orchestrator</option>
      <option value="terraform">Terraform Blocks</option>
    </select>

    {#if estimatedCost > 0}
      <button
        class="cost-badge"
        onclick={() => (showCostBreakdown = true)}
        title="View Detailed Monthly Cost Breakdown"
      >
        <span class="cost-label">EST. COST:</span>
        <span class="cost-amount">${estimatedCost.toFixed(2)} / mo</span>
        <div class="cost-chevron">
          <ChevronRight size={14} />
        </div>
      </button>
    {/if}
  </div>

  <CostBreakdown bind:isOpen={showCostBreakdown} {nodes} />

  <div class="actions">
    <!-- Status -->
    <div
      class="sync-status"
      class:diverged={syncStatus === "DIVERGED"}
      class:synced={syncStatus === "SYNCED"}
    >
      <div class="status-dot"></div>
      <span
        >{syncStatus === "DIVERGED"
          ? "Diverged"
          : syncStatus === "SYNCED"
            ? "Synced"
            : "Draft"}</span
      >
    </div>

    <div class="divider"></div>

    <!-- Help & Discovery Group -->
    <div class="btn-group" aria-label="Help & Discovery">
      <button
        class="action-btn"
        onclick={loadTemplate}
        title="Load a starter 3-Tier App blueprint onto the canvas"
      >
        <LayoutTemplate size={16} /> <span class="btn-label">Template</span>
      </button>
      <button
        class="action-btn"
        onclick={() => (showTutorial = true)}
        title="Open the tutorial guide and sample architectures"
      >
        <HelpCircle size={16} /> <span class="btn-label">Tutorial</span>
      </button>
      <button
        class="action-btn suggestions-btn"
        onclick={() => (showSuggestions = !showSuggestions)}
        title="AI-powered security product recommendations for your architecture"
      >
        <Sparkles size={16} /> <span class="btn-label">Suggestions</span>
      </button>
    </div>

    <div class="divider"></div>

    <!-- View Group -->
    <div class="btn-group" aria-label="View controls">
      <button
        class="action-btn"
        class:active={viewMode === "3d"}
        onclick={() => (viewMode = viewMode === "2d" ? "3d" : "2d")}
        title={viewMode === "3d" ? "Switch to flat 2D view" : "Switch to isometric 3D view"}
      >
        <Box size={16} />
        <span class="btn-label">{viewMode === "3d" ? "2D" : "3D"}</span>
      </button>
    </div>

    <div class="divider"></div>

    <!-- Persistence Group -->
    <div class="btn-group" aria-label="Save & Load">
      <button class="action-btn" onclick={saveLayout} title="Save diagram to cloud database">
        <Save size={16} /> <span class="btn-label">Save</span>
      </button>
      <button
        class="action-btn"
        onclick={() => (showLoadModal = true)}
        title="Load a previously saved diagram"
      >
        <Upload size={16} /> <span class="btn-label">Load</span>
      </button>
      <button
        class="action-btn"
        onclick={() => (showHistoryModal = true)}
        disabled={!currentDiagramId}
        title="Browse and restore past versions of this diagram"
      >
        <History size={16} /> <span class="btn-label">History</span>
      </button>
    </div>

    <div class="divider"></div>

    <!-- Security & Governance Group -->
    <div class="btn-group" aria-label="Security & Governance">
      <div class="dcf-dropdown-container">
        <button 
          class="action-btn security-btn" 
          class:active={globalState.dcfModeEnabled}
          onclick={() => showDCFDropdown = !showDCFDropdown}
          title="Distributed Cloud Firewall controls — toggle DCF mode, upload policies, open console"
        >
          <ShieldAlert size={16} color={globalState.dcfModeEnabled ? "#10b981" : "#f59e0b"} /> 
          <span class="btn-label">DCF</span>
        </button>

        {#if showDCFDropdown}
          <div class="dcf-dropdown glass-panel" in:fade={{ duration: 100 }}>
            <div class="dropdown-header">
              <ShieldCheck size={14} />
              <span>DCF CONTROLS</span>
            </div>
            
            <div class="dropdown-item toggle-row">
              <span>Enabled</span>
              <button 
                class="toggle-switch" 
                class:on={globalState.dcfModeEnabled}
                onclick={(e) => { e.stopPropagation(); toggleDCFMode(); }}
              ></button>
            </div>

            <div class="dropdown-divider"></div>

            <button class="dropdown-item" onclick={() => { showFirewallManager = true; showDCFDropdown = false; }}>
              <TerminalIcon size={14} />
              <span>Advanced Console</span>
            </button>

            <label class="dropdown-item file-upload">
              <Upload size={14} />
              <span>Upload Policies</span>
              <input type="file" accept=".json" onchange={handleJSONPolicyUpload} hidden />
            </label>
          </div>
        {/if}
      </div>
      <button
        class="action-btn"
        onclick={() => (showAdminModal = true)}
        title="Review governance controls, approval workflows, and audit logs"
      >
        <Shield size={16} color="#8b5cf6" /> <span class="btn-label">Govern</span>
      </button>
      <button
        class="action-btn"
        onclick={() => (showMarketplaceModal = true)}
        title="Browse and install security vendor integrations"
      >
        <ShoppingBag size={16} color="var(--accent-avx)" /> <span class="btn-label">Market</span>
      </button>
    </div>

    <div class="divider"></div>

    <!-- Import / Export Group -->
    <div class="btn-group" aria-label="Import & Export">
      <button class="action-btn" onclick={exportLayout} title="Export architecture as JSON file">
        <FileDown size={16} />
      </button>
      <label class="action-btn file-import-btn" title="Import an architecture JSON file">
        <FileUp size={16} />
        <input type="file" accept=".json" onchange={importLayout} />
      </label>
      <label
        class="action-btn file-import-btn"
        title="Import a Terraform .tf file to auto-generate canvas nodes"
      >
        <FileCode size={16} color="#8b5cf6" />
        <input type="file" accept=".tf" onchange={importTerraform} />
      </label>
      <label class="action-btn file-import-btn" title="Import DCF policy rules from a JSON file">
        <Shield size={16} color="var(--accent-avx)" />
        <input type="file" accept=".json" onchange={importDCF} />
      </label>
      <button class="action-btn" onclick={downloadImage} title="Export canvas as a PNG image">
        <Image size={16} />
      </button>
    </div>

    <!-- Lifecycle -->
    <button
      class="action-btn lifecycle-btn"
      onclick={() => (showDeploymentModal = true)}
      disabled={!currentDiagramId}
      title="Manage deployment lifecycle — Plan, Apply, Destroy operations"
    >
      <Terminal size={16} /> <span class="btn-label">Lifecycle</span>
    </button>

    <DiagramListModal
      bind:isOpen={showLoadModal}
      onSelect={handleSelectDiagram}
    />

    <VersionHistoryModal
      bind:isOpen={showHistoryModal}
      diagramId={currentDiagramId}
      onRestore={(v: any) => {
        nodes = v.diagramSnapshot.nodes || [];
        edges = v.diagramSnapshot.edges || [];
        alert(`Restored to version ${v.versionNumber}`);
      }}
    />

    <DeploymentModal
      bind:isOpen={showDeploymentModal}
      diagramId={currentDiagramId}
      currentVersionId={currentVersionId}
    />

    <button
      class="generate-btn"
      onclick={handleGenerate}
      disabled={isGenerating}
    >
      {#if isGenerating}
        <div class="spinner"></div>
        Generating...
      {:else}
        <Play size={16} />
        Generate Manifests
      {/if}
    </button>
  </div>

{#if showAdminModal}
  <AdminReviewModal 
    bind:isOpen={showAdminModal} 
    onClose={() => (showAdminModal = false)} 
  />
{/if}

{#if showFirewallManager && currentDiagramId}
  <FirewallManager
    diagramId={currentDiagramId}
    bind:isOpen={showFirewallManager}
    onClose={() => showFirewallManager = false}
  />
{/if}

{#if showResult}
  <div
    class="modal-backdrop"
    onclick={closeResult}
    onkeydown={(e) => e.key === "Enter" && closeResult()}
    role="button"
    tabindex="0"
    aria-label="Close modal"
  >
    <div
      class="modal-content glass-panel"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
      role="none"
    >
      <div class="modal-header">
        <div class="tabs">
          {#if generatedCode}
            <button
              class="tab-btn"
              class:active={activeTab === "terraform"}
              onclick={() => (activeTab = "terraform")}
            >
              Terraform (main.tf)
            </button>
          {/if}
          {#if generatedK8s}
            <button
              class="tab-btn"
              class:active={activeTab === "kubernetes"}
              onclick={() => (activeTab = "kubernetes")}
            >
              Kubernetes (k8s.yaml)
            </button>
          {/if}
          {#if simulationResult}
            <button
              class="tab-btn"
              class:active={activeTab === "security"}
              onclick={() => (activeTab = "security")}
            >
              <AlertTriangle
                size={14}
                style="display:inline; margin-right:4px; vertical-align:text-bottom; color: {simulationResult
                  .vulnerabilities.length > 0
                  ? '#ff4444'
                  : '#3b82f6'};"
              />
              Simulation Report ({simulationResult.vulnerabilities.length} Issues)
            </button>
          {/if}
        </div>
        <div class="modal-actions">
          {#if activeTab !== "security"}
            <button
              class="icon-btn"
              onclick={copyCode}
              title="Copy to clipboard"
            >
              {#if copied}
                <Check size={18} color="var(--accent-primary)" />
              {:else}
                <Copy size={18} />
              {/if}
            </button>
            <button
              class="icon-btn"
              onclick={downloadCode}
              title="Download code"
            >
              <Download size={18} />
            </button>
          {/if}
          <button class="close-btn" onclick={closeResult}>&times;</button>
        </div>
      </div>
      <div class="code-container">
        {#if activeTab === "security"}
          <div class="security-report">
            <h3>Data Flow Simulation Report</h3>
            <p class="summary-text">
              The simulation provenance graph evaluated the network flow. Safe
              routed data flows are highlighted in <strong
                style="color: #10b981">GREEN</strong
              >. Vulnerable routes have been highlighted in
              <strong style="color: #ff4444">RED</strong>
              on the canvas. Traffic dropped by Aviatrix DCF is shown in
              <strong style="color: #ea580c">ORANGE</strong>.
            </p>

            {#if importedDCF}
              <div class="dcf-banner">
                <Shield size={16} />
                <span
                  ><strong>{importedDCF.policies.length}</strong> External DCF Policies
                  are actively enforcing routes.</span
                >
              </div>
            {/if}

            <div class="metrics-grid">
              <div class="metric-card">
                <span
                  class="metric-value {simulationResult?.vulnerabilities.filter(
                    (v) => v.severity === 'high',
                  ).length
                    ? 'error'
                    : 'success'}"
                  >{simulationResult?.vulnerabilities.filter(
                    (v) => v.severity === "high",
                  ).length}</span
                >
                <span class="metric-label">High Risk</span>
              </div>
              <div class="metric-card">
                <span
                  class="metric-value {simulationResult?.vulnerabilities.filter(
                    (v) => v.severity === 'medium',
                  ).length
                    ? 'warning'
                    : 'success'}"
                  >{simulationResult?.vulnerabilities.filter(
                    (v) => v.severity === "medium",
                  ).length}</span
                >
                <span class="metric-label">Medium Risk</span>
              </div>
              <div class="metric-card">
                <span
                  class="metric-value {simulationResult?.vulnerabilities.filter(
                    (v) => v.category === 'ai',
                  ).length
                    ? 'error'
                    : 'success'}"
                  >{simulationResult?.vulnerabilities.filter(
                    (v) => v.category === "ai",
                  ).length}</span
                >
                <span class="metric-label">AI Risk</span>
              </div>
              <div class="metric-card">
                <span
                  class="metric-value {simulationResult?.vulnerabilities.filter(
                    (v) => v.category === 'capacity',
                  ).length
                    ? 'warning'
                    : 'success'}"
                  >{simulationResult?.vulnerabilities.filter(
                    (v) => v.category === "capacity",
                  ).length}</span
                >
                <span class="metric-label">Capacity Risk</span>
              </div>
              <div class="metric-card">
                <span class="metric-value warning"
                  >{simulationResult?.blockedEdges.length}</span
                >
                <span class="metric-label">DCF Blocked</span>
              </div>
              <div class="metric-card">
                <span class="metric-value success"
                  >{simulationResult?.simulatedEdges.length}</span
                >
                <span class="metric-label">Flows Scanned</span>
              </div>
            </div>

            <button class="view-canvas-btn" onclick={closeResult}>
              <Network size={16} /> View Provenance Graph on Canvas
            </button>

            <div class="vuln-list">
              {#each simulationResult?.vulnerabilities || [] as vuln}
                <div
                  class="vuln-card"
                  class:blocked-card={vuln.severity === "low"}
                  class:medium-card={vuln.severity === "medium"}
                >
                  <div class="vuln-header">
                    {#if vuln.severity === "low" || vuln.severity === "blocked"}
                      <Shield size={18} color="#ea580c" />
                    {:else if vuln.severity === "medium"}
                      <AlertTriangle size={18} color="#f59e0b" />
                    {:else}
                      <AlertTriangle size={18} color="#ff4444" />
                    {/if}
                    <h4>
                      {#if vuln.category}
                        <span
                          style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;"
                          >[{vuln.category}]</span
                        >
                      {/if}
                      {vuln.title}
                    </h4>
                    <span class="severity-badge {vuln.severity}"
                      >{vuln.severity === "low"
                        ? "INFO"
                        : vuln.severity === "blocked"
                          ? "BLOCKED"
                          : vuln.severity.toUpperCase()}</span
                    >
                  </div>
                  <p>{vuln.description}</p>
                </div>
              {/each}
              {#if simulationResult?.vulnerabilities.length === 0}
                <div class="safe-card">
                  <Check
                    size={24}
                    color="#10b981"
                    style="margin-right: 12px;"
                  />
                  <p style="margin:0; font-weight: 500; color: #10b981">
                    No insecure data flows found. Simulation paths look secure.
                  </p>
                </div>
              {/if}
            </div>
          </div>
        {:else}
          {#if activeTab === "terraform"}
            <TerraformEditor
              bind:code={generatedCode}
              type="terraform"
              onSave={(newCode) => handleSaveTerraform(newCode, "terraform")}
            />
          {:else}
            <TerraformEditor
              bind:code={generatedK8s}
              type="kubernetes"
              onSave={(newCode) => handleSaveTerraform(newCode, "kubernetes")}
            />
          {/if}
        {/if}
      </div>
    </div>
  </div>
{/if}
</nav>

<style>
  .top-nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 16px;
    height: 56px;
    border-radius: 0;
    border-left: none;
    border-right: none;
    border-top: none;
    z-index: 50;
    gap: 8px;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
  }

  .logo-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    background: rgba(99, 102, 241, 0.1);
    border-radius: 8px;
    box-shadow: var(--neon-glow);
  }

  .title-dropdown {
    margin-left: 0px;
    padding: 8px 16px;
    background: transparent;
    border: 1px solid transparent;
    color: var(--text-main);
    border-radius: 8px;
    font-size: 1.1rem;
    font-weight: 600;
    letter-spacing: -0.5px;
    cursor: pointer;
    outline: none;
    transition: all 0.2s;
    appearance: none;
    background-image: url('data:image/svg+xml;utf8,<svg fill="none" viewBox="0 0 24 24" stroke="white" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>');
    background-repeat: no-repeat;
    background-position: right 12px center;
    background-size: 16px;
    padding-right: 36px;
  }

  .title-dropdown:hover {
    background-color: rgba(255, 255, 255, 0.05);
    border-color: var(--border-color);
  }

  .cost-badge {
    margin-left: 20px;
    padding: 6px 12px;
    background: rgba(16, 185, 129, 0.08);
    border: 1px solid rgba(16, 185, 129, 0.2);
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .cost-badge:hover {
    background: rgba(16, 185, 129, 0.15);
    border-color: rgba(16, 185, 129, 0.4);
    transform: translateY(-1px);
  }

  .cost-label {
    font-size: 0.65rem;
    font-weight: 800;
    color: var(--text-muted);
    letter-spacing: 0.5px;
  }

  .cost-amount {
    font-size: 0.85rem;
    font-weight: 700;
    color: #10b981;
  }

  .cost-chevron {
    color: rgba(16, 185, 129, 0.5);
    transition: transform 0.2s;
    display: flex;
    align-items: center;
  }

  .cost-badge:hover .cost-chevron {
    transform: translateX(2px);
    color: #10b981;
  }

  .actions {
    display: flex;
    align-items: center;
    gap: 6px;
    overflow-x: auto;
    flex-shrink: 1;
    min-width: 0;
  }

  .btn-group {
    display: flex;
    align-items: center;
    gap: 2px;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.04);
    border-radius: 10px;
    padding: 2px;
  }

  .btn-group .action-btn {
    border: none;
    background: transparent;
    border-radius: 8px;
    padding: 6px 10px;
    font-size: 0.8rem;
  }

  .btn-group .action-btn:hover {
    background: rgba(255, 255, 255, 0.08);
  }

  .btn-label {
    pointer-events: none;
  }

  .action-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--border-color);
    color: var(--text-main);
    padding: 6px 10px;
    border-radius: 8px;
    font-size: 0.8rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
    position: relative;
  }

  .action-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }

  .action-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .action-btn.active {
    background: rgba(99, 102, 241, 0.15);
    border-color: rgba(99, 102, 241, 0.3);
    color: #818cf8;
  }

  .lifecycle-btn {
    border-color: rgba(249, 17, 110, 0.2);
    color: var(--accent-avx);
  }

  .lifecycle-btn:hover {
    background: rgba(249, 17, 110, 0.1);
    border-color: rgba(249, 17, 110, 0.4);
  }

  .sync-status {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 10px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 20px;
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    color: var(--text-muted);
    margin-left: 12px;
  }

  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--text-muted);
  }

  .sync-status.synced {
    color: #10b981;
    background: rgba(16, 185, 129, 0.1);
  }
  .sync-status.synced .status-dot {
    background: #10b981;
    box-shadow: 0 0 8px #10b981;
  }

  .sync-status.diverged {
    color: #f59e0b;
    background: rgba(245, 158, 11, 0.1);
  }
  .sync-status.diverged .status-dot {
    background: #f59e0b;
    box-shadow: 0 0 8px #f59e0b;
  }

  .divider {
    width: 1px;
    height: 24px;
    background: var(--border-color);
    margin: 0 4px;
  }

  .file-import-btn {
    cursor: pointer;
    margin: 0;
  }

  .file-import-btn input[type="file"] {
    display: none;
  }

  .generate-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    background: linear-gradient(135deg, #10b981, #059669);
    border: none;
    color: white;
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
    flex-shrink: 0;
    box-shadow: 0 0 12px rgba(16, 185, 129, 0.25);
  }

  .generate-btn:hover {
    background: linear-gradient(135deg, #059669, #047857);
    transform: translateY(-1px);
    box-shadow: 0 0 20px rgba(16, 185, 129, 0.4);
  }

  .generate-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  /* DCF Dropdown Styles */
  .dcf-dropdown-container {
    position: relative;
  }

  .dcf-dropdown {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    width: 200px;
    background: rgba(15, 17, 21, 0.98);
    backdrop-filter: blur(16px);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 8px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    z-index: 100;
  }

  .dropdown-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    font-size: 0.7rem;
    font-weight: 800;
    color: var(--text-muted);
    letter-spacing: 0.05em;
  }

  .dropdown-item {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 10px 12px;
    background: transparent;
    border: none;
    border-radius: 8px;
    color: var(--text-main);
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
  }

  .dropdown-item:hover {
    background: rgba(255, 255, 255, 0.05);
    color: white;
  }

  .dropdown-divider {
    height: 1px;
    background: var(--border-color);
    margin: 6px 8px;
  }

  .toggle-row {
    justify-content: space-between;
    cursor: default;
  }

  .toggle-row:hover {
    background: transparent;
  }

  .toggle-switch {
    width: 34px;
    height: 18px;
    background: #334155;
    border-radius: 20px;
    position: relative;
    cursor: pointer;
    transition: all 0.3s;
    border: none;
    padding: 0;
  }

  .toggle-switch::before {
    content: "";
    position: absolute;
    width: 14px;
    height: 14px;
    background: white;
    border-radius: 50%;
    top: 2px;
    left: 2px;
    transition: all 0.3s;
  }

  .toggle-switch.on {
    background: #10b981;
  }

  .toggle-switch.on::before {
    transform: translateX(16px);
  }

  .file-upload {
    cursor: pointer;
  }

  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: white;
    animation: spin 1s ease-in-out infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* Modal Styles */
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal-content {
    width: 800px;
    max-width: 90vw;
    height: 80vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px;
    border-bottom: 1px solid var(--border-color);
    background: rgba(0, 0, 0, 0.2);
  }

  .modal-header .tabs {
    display: flex;
    gap: 8px;
  }

  .tab-btn {
    background: transparent;
    border: none;
    padding: 8px 16px;
    color: var(--text-muted);
    font-size: 0.95rem;
    font-weight: 500;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: all 0.2s;
  }

  .tab-btn:hover {
    color: var(--text-main);
  }

  .tab-btn.active {
    color: var(--accent-primary);
    border-bottom-color: var(--accent-primary);
  }

  .modal-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .icon-btn {
    background: transparent;
    border: none;
    color: var(--text-muted);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 6px;
    border-radius: 6px;
  }

  .icon-btn:hover {
    background: var(--bg-panel-hover);
    color: var(--text-main);
  }

  .close-btn {
    background: transparent;
    border: none;
    color: var(--text-muted);
    font-size: 1.5rem;
    line-height: 1;
    padding: 0 4px;
  }

  .close-btn:hover {
    color: var(--text-main);
  }

  .code-container {
    flex: 1;
    overflow: auto;
    padding: 24px;
    background: #0d0d0d;
  }

  pre {
    margin: 0;
    font-family: "Fira Code", "Courier New", Courier, monospace;
    font-size: 0.9rem;
    line-height: 1.5;
    color: #a8b2d1;
    white-space: pre-wrap;
  }

  .security-report {
    color: var(--text-main);
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .security-report h3 {
    margin: 0;
    font-size: 1.25rem;
    color: #ff4444;
  }

  .vuln-count {
    font-weight: 800;
  }

  .summary-text {
    color: var(--text-muted);
    font-size: 0.95rem;
    margin: 0 0 16px 0;
  }

  .vuln-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .vuln-card {
    background: rgba(255, 68, 68, 0.05);
    border: 1px solid rgba(255, 68, 68, 0.2);
    border-radius: 8px;
    padding: 16px;
  }

  .blocked-card {
    background: rgba(234, 88, 12, 0.05);
    border-color: rgba(234, 88, 12, 0.2);
  }

  .medium-card {
    background: rgba(245, 158, 11, 0.05);
    border-color: rgba(245, 158, 11, 0.2);
  }

  .safe-card {
    display: flex;
    align-items: center;
    background: rgba(16, 185, 129, 0.05);
    border: 1px solid rgba(16, 185, 129, 0.2);
    border-radius: 8px;
    padding: 16px;
  }

  .view-canvas-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: rgba(99, 102, 241, 0.1);
    border: 1px solid rgba(99, 102, 241, 0.3);
    color: #818cf8;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    margin-bottom: 24px;
    width: fit-content;
  }

  .view-canvas-btn:hover {
    background: rgba(99, 102, 241, 0.2);
    border-color: rgba(99, 102, 241, 0.5);
    color: white;
  }

  .vuln-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
  }

  .vuln-header h4 {
    margin: 0;
    flex: 1;
    color: #ff4444;
    font-size: 1.05rem;
  }

  .severity-badge {
    font-size: 0.75rem;
    padding: 4px 8px;
    border-radius: 4px;
    font-weight: bold;
    text-transform: uppercase;
  }

  .severity-badge.high {
    background: rgba(255, 68, 68, 0.2);
    color: #ff4444;
    border: 1px solid #ff4444;
  }

  .severity-badge.medium {
    background: rgba(245, 158, 11, 0.2);
    color: #f59e0b;
    border: 1px solid #f59e0b;
  }

  .severity-badge.low {
    background: rgba(59, 130, 246, 0.2);
    color: #3b82f6;
    border: 1px solid #3b82f6;
  }
</style>
