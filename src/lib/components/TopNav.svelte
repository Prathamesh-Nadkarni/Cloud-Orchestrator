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
  } from "lucide-svelte";
  import { toPng } from "html-to-image";
  import CostBreakdown from "./CostBreakdown.svelte";
  import {
    simulateDataFlow,
    type Vulnerability,
    type SimulationResult,
    type ImportedDCF,
  } from "$lib/utils/securitySimulator";
  import { parseCanvas } from "$lib/generators/index.js";

  let {
    nodes = $bindable(),
    edges = $bindable(),
    currentView = $bindable(),
    viewMode = $bindable("2d"),
    showTutorial = $bindable(false),
    onSimulationComplete = () => {},
  } = $props();
  let isGenerating = $state(false);
  let showResult = $state(false);
  let generatedCode = $state("");
  let generatedK8s = $state("");
  let activeTab = $state("terraform");
  let copied = $state(false);
  let showCostBreakdown = $state(false);

  // Security Simulation State
  let simulationResult: SimulationResult | null = $state(null);
  let importedDCF: ImportedDCF | null = $state(null);
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
      // Run data flow simulation
      simulationResult = simulateDataFlow(
        nodes,
        edges,
        importedDCF || undefined,
      );

      // Highlight edges dynamically based on simulation result
      edges = edges.map((edge: any) => {
        const isVulnerable = simulationResult!.vulnerabilities.some(
          (v) => v.edgeId === edge.id,
        );
        const isSimulated = simulationResult!.simulatedEdges.includes(edge.id);
        const isBlocked = simulationResult!.blockedEdges.includes(edge.id);

        if (isBlocked) {
          return {
            ...edge,
            style:
              "stroke: #ea580c; stroke-width: 3; filter: drop-shadow(0 0 5px rgba(234, 88, 12, 0.8)); stroke-dasharray: 5 5;",
            animated: false,
          };
        } else if (isVulnerable) {
          return {
            ...edge,
            style:
              "stroke: #ff4444; stroke-width: 3; filter: drop-shadow(0 0 5px rgba(255, 68, 68, 0.8));",
            animated: true,
          };
        } else if (isSimulated) {
          return {
            ...edge,
            style:
              "stroke: #10b981; stroke-width: 3; filter: drop-shadow(0 0 5px rgba(16, 185, 129, 0.8));",
            animated: true,
          };
        } else {
          return {
            ...edge,
            style: "stroke: var(--text-main); stroke-width: 2;",
            animated: false,
          };
        }
      });

      if (onSimulationComplete) {
        onSimulationComplete(edges);
      }

      const data = parseCanvas(nodes, edges);

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

  function saveLayout() {
    const layout = JSON.stringify({ nodes, edges });
    localStorage.setItem("multicloud-layout", layout);
    alert("Layout saved to local storage!");
  }

  function loadLayout() {
    const layoutStr = localStorage.getItem("multicloud-layout");
    if (layoutStr) {
      try {
        const layout = JSON.parse(layoutStr);
        nodes = layout.nodes || [];
        edges = layout.edges || [];
      } catch (e) {
        alert("Failed to parse saved layout.");
      }
    } else {
      alert("No saved layout found.");
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

  function importDCF(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          importedDCF = JSON.parse(content);
          alert(
            `Successfully loaded DCF Policy profile with ${importedDCF?.policies.length} rules.`,
          );
        } catch (error) {
          alert("Error parsing DCF Policy JSON file");
          console.error(error);
        }
      };
      reader.readAsText(file);
    }
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
      <option value="terraform">Terraform Converter</option>
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
    <button
      class="action-btn"
      onclick={loadTemplate}
      title="Load 3-Tier App Blueprint"
    >
      <LayoutTemplate size={16} /> Template
    </button>
    <div class="divider"></div>
    <button
      class="action-btn"
      onclick={() => (showTutorial = true)}
      title="Show Tutorial"
    >
      <HelpCircle size={16} /> Tutorial
    </button>
    <button
      class="action-btn"
      class:active={viewMode === "3d"}
      onclick={() => (viewMode = viewMode === "2d" ? "3d" : "2d")}
      title="Toggle 3D View"
    >
      <Box size={16} />
      {viewMode === "3d" ? "2D View" : "3D View"}
    </button>
    <div class="divider"></div>
    <button class="action-btn" onclick={saveLayout} title="Save to Browser">
      <Save size={16} /> Save
    </button>
    <button class="action-btn" onclick={loadLayout} title="Load from Browser">
      <Upload size={16} /> Load
    </button>
    <button class="action-btn" onclick={exportLayout} title="Export JSON">
      <FileDown size={16} /> JSON
    </button>
    <label class="action-btn file-import-btn" title="Import JSON">
      <FileUp size={16} /> JSON
      <input type="file" accept=".json" onchange={importLayout} />
    </label>
    <label
      class="action-btn file-import-btn"
      title="Import Terraform File (.tf)"
    >
      <FileCode size={16} color="#8b5cf6" /> .tf
      <input type="file" accept=".tf" onchange={importTerraform} />
    </label>
    <label class="action-btn file-import-btn" title="Import DCF Policies">
      <Shield size={16} color="var(--accent-avx)" /> DCF
      <input type="file" accept=".json" onchange={importDCF} />
    </label>
    <button class="action-btn" onclick={downloadImage} title="Export PNG Image">
      <Image size={16} /> PNG
    </button>

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
</nav>

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
                <span class="metric-label">High Risk Vulnerabilities</span>
              </div>
              <div class="metric-card">
                <span class="metric-value warning"
                  >{simulationResult?.blockedEdges.length}</span
                >
                <span class="metric-label">Flows Blocked by DCF</span>
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
                >
                  <div class="vuln-header">
                    {#if vuln.severity === "low"}
                      <Shield size={18} color="#ea580c" />
                    {:else}
                      <AlertTriangle size={18} color="#ff4444" />
                    {/if}
                    <h4>{vuln.title}</h4>
                    <span class="severity-badge {vuln.severity}"
                      >{vuln.severity === "low"
                        ? "INFO"
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
          <pre><code
              >{activeTab === "terraform" ? generatedCode : generatedK8s}</code
            ></pre>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .top-nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 24px;
    height: 64px;
    border-radius: 0;
    border-left: none;
    border-right: none;
    border-top: none;
    z-index: 50;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 12px;
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
    gap: 12px;
  }

  .action-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--border-color);
    color: var(--text-main);
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .action-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
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
    gap: 8px;
    background: linear-gradient(135deg, var(--accent-primary) 0%, #818cf8 100%);
    color: white;
    border: none;
    padding: 8px 20px;
    border-radius: 8px;
    font-size: 0.95rem;
    font-weight: 600;
    box-shadow: var(--neon-glow);
  }

  .generate-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 0 15px rgba(99, 102, 241, 0.7);
  }

  .generate-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
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
