<script>
<script>
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
  } from "lucide-svelte";
  import { toPng } from "html-to-image";

  let { nodes = $bindable(), edges = $bindable() } = $props();
  let isGenerating = $state(false);
  let showResult = $state(false);
  let generatedCode = $state("");
  let generatedK8s = $state("");
  let activeTab = $state("terraform");
  let copied = $state(false);

  let estimatedCost = $derived(
    nodes.reduce((acc, node) => {
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
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodes, edges }),
      });

      const data = await response.json();
      if (data.code) {
        generatedCode = data.code;
        generatedK8s = data.k8s || "";
        activeTab = "terraform";
        showResult = true;
      } else {
        alert("Failed to generate code: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      alert("Error connecting to the generation API.");
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

  function importLayout(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const layout = JSON.parse(e.target.result);
        nodes = layout.nodes || [];
        edges = layout.edges || [];
      } catch (err) {
        alert("Failed to import layout: Invalid JSON.");
      }
      event.target.value = null;
    };
    reader.readAsText(file);
  }

  function downloadImage() {
    const target = document.querySelector(".svelte-flow");
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
          parentNode: "aws-vpc-1",
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
          parentNode: "aws-vpc-1",
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
          parentNode: "aws-vpc-1",
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
          parentNode: "aws-subnet-1",
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
          parentNode: "aws-subnet-2",
        },
        {
          id: "aws-storage-1",
          type: "cloud",
          position: { x: 20, y: 80 },
          data: { provider: "aws", type: "storage", label: "RDS Database" },
          parentNode: "aws-subnet-3",
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
</script>

<nav class="top-nav glass-panel">
  <div class="brand">
    <div class="logo-icon">
      <Network size={20} color="var(--accent-primary)" />
    </div>
    <span class="title">MultiCloud <span class="highlight">Designer</span></span
    >

    {#if estimatedCost > 0}
      <div class="cost-badge" title="Estimated Monthly Runtime Cost">
        ~${estimatedCost.toFixed(2)} / mo
      </div>
    {/if}
  </div>

  <div class="actions">
    <button
      class="action-btn"
      onclick={loadTemplate}
      title="Load 3-Tier App Blueprint"
    >
      <LayoutTemplate size={16} /> Template
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
        Generate Terraform
      {/if}
    </button>
  </div>
</nav>

{#if showResult}
  <div class="modal-backdrop" onclick={closeResult}>
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="modal-content glass-panel" onclick={(e) => e.stopPropagation()}>
      <div class="modal-header">
        <div class="tabs">
          <button
            class="tab-btn"
            class:active={activeTab === "terraform"}
            onclick={() => (activeTab = "terraform")}
          >
            Terraform (main.tf)
          </button>
          {#if generatedK8s}
            <button
              class="tab-btn"
              class:active={activeTab === "kubernetes"}
              onclick={() => (activeTab = "kubernetes")}
            >
              Kubernetes (k8s.yaml)
            </button>
          {/if}
        </div>
        <div class="modal-actions">
          <button class="icon-btn" onclick={copyCode} title="Copy to clipboard">
            {#if copied}
              <Check size={18} color="var(--accent-primary)" />
            {:else}
              <Copy size={18} />
            {/if}
          </button>
          <button class="icon-btn" onclick={downloadCode} title="Download code">
            <Download size={18} />
          </button>
          <button class="close-btn" onclick={closeResult}>&times;</button>
        </div>
      </div>
      <div class="code-container">
        <pre><code
            >{activeTab === "terraform" ? generatedCode : generatedK8s}</code
          ></pre>
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

  .title {
    font-size: 1.1rem;
    font-weight: 500;
    letter-spacing: -0.5px;
  }

  .highlight {
    font-weight: 700;
    color: var(--accent-primary);
  }

  .cost-badge {
    margin-left: 16px;
    padding: 4px 12px;
    background: rgba(16, 185, 129, 0.1);
    color: #10b981;
    border: 1px solid rgba(16, 185, 129, 0.3);
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 0.3px;
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
</style>
