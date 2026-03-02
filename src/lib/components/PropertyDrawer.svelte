<script>
  import { X } from "lucide-svelte";

  let {
    selectedNode = $bindable(),
    selectedEdge = $bindable(),
    nodes = $bindable(),
    edges = $bindable(),
  } = $props();

  function closeDrawer() {
    selectedNode = null;
    selectedEdge = null;
  }

  function updateData(key, value) {
    if (selectedNode) {
      nodes = nodes.map((n) => {
        if (n.id === selectedNode.id) {
          return { ...n, data: { ...n.data, [key]: value } };
        }
        return n;
      });
      selectedNode.data[key] = value;
    }
  }

  function updateEdgeData(key, value) {
    if (selectedEdge) {
      edges = edges.map((e) => {
        if (e.id === selectedEdge.id) {
          const updatedEdge = { ...e, data: { ...e.data, [key]: value } };

          // Re-calculate visual styles
          if (key === "protocol") {
            switch (value) {
              case "http":
                updatedEdge.style =
                  "stroke: #3b82f6; stroke-width: 2; stroke-dasharray: 5 5;";
                break;
              case "https":
                updatedEdge.style = "stroke: #10b981; stroke-width: 2;";
                break;
              case "tcp":
                updatedEdge.style = "stroke: #f59e0b; stroke-width: 2;";
                break;
              case "udp":
                updatedEdge.style =
                  "stroke: #8b5cf6; stroke-width: 2; stroke-dasharray: 4 8;";
                break;
              default:
                updatedEdge.style =
                  "stroke: var(--text-color); stroke-width: 2;";
                break;
            }
          }
          return updatedEdge;
        }
        return e;
      });
      selectedEdge.data[key] = value;
    }
  }
</script>

<aside
  class="property-drawer glass-panel"
  class:open={!!selectedNode || !!selectedEdge}
>
  {#if selectedNode}
    <div class="drawer-header">
      <div class="header-info">
        <span
          class="provider-badge"
          style="color: var(--accent-{selectedNode.data.provider})"
        >
          {selectedNode.data.provider.toUpperCase()}
        </span>
        <h3>{selectedNode.data.label} Settings</h3>
      </div>
      <button class="close-btn" onclick={closeDrawer}>
        <X size={20} />
      </button>
    </div>

    <div class="drawer-content">
      <div class="form-group">
        <label for="resource-name">Resource Name</label>
        <input
          id="resource-name"
          type="text"
          value={selectedNode.data.name || ""}
          oninput={(e) => updateData("name", e.target.value)}
          placeholder="my-{selectedNode.data.label
            .toLowerCase()
            .replace(/\s+/g, '-')}"
        />
      </div>

      {#if selectedNode.data.provider === "aws" || selectedNode.data.provider === "azure" || selectedNode.data.provider === "gcp"}
        <div class="form-group">
          <label for="region">Region</label>
          <input
            id="region"
            type="text"
            value={selectedNode.data.region || ""}
            oninput={(e) => updateData("region", e.target.value)}
            placeholder={selectedNode.data.provider === "aws"
              ? "us-east-1"
              : "East US"}
          />
        </div>
      {/if}

      {#if selectedNode.data.label.includes("VPC") || selectedNode.data.label.includes("VNet") || selectedNode.data.label.includes("Subnet")}
        <div class="form-group">
          <label for="cidr">IPv4 CIDR Block</label>
          <input
            id="cidr"
            type="text"
            value={selectedNode.data.cidr || "10.0.0.0/16"}
            oninput={(e) => updateData("cidr", e.target.value)}
            placeholder="10.0.0.0/16"
          />
        </div>
      {/if}

      {#if selectedNode.data.label.includes("Instance") || selectedNode.data.label.includes("VM") || selectedNode.data.label.includes("Engine") || selectedNode.data.type === "kubernetes"}
        <div class="form-group">
          <label for="instance-size">Node/Instance Size</label>
          <select
            id="instance-size"
            value={selectedNode.data.size ||
              (selectedNode.data.provider === "aws"
                ? "t2.micro"
                : selectedNode.data.provider === "azure"
                  ? "Standard_B1s"
                  : "e2-micro")}
            onchange={(e) => updateData("size", e.target.value)}
          >
            {#if selectedNode.data.provider === "aws"}
              <optgroup label="General Purpose (T-Family)">
                <option value="t2.micro">t2.micro (1 vCPU, 1 GiB)</option>
                <option value="t3.micro">t3.micro (2 vCPU, 1 GiB)</option>
                <option value="t3.small">t3.small (2 vCPU, 2 GiB)</option>
                <option value="t3.medium">t3.medium (2 vCPU, 4 GiB)</option>
                <option value="t3.large">t3.large (2 vCPU, 8 GiB)</option>
              </optgroup>
              <optgroup label="General Purpose (M-Family)">
                <option value="m5.large">m5.large (2 vCPU, 8 GiB)</option>
                <option value="m5.xlarge">m5.xlarge (4 vCPU, 16 GiB)</option>
                <option value="m5.2xlarge">m5.2xlarge (8 vCPU, 32 GiB)</option>
              </optgroup>
              <optgroup label="Compute Optimized (C-Family)">
                <option value="c5.large">c5.large (2 vCPU, 4 GiB)</option>
                <option value="c5.xlarge">c5.xlarge (4 vCPU, 8 GiB)</option>
                <option value="c5.2xlarge">c5.2xlarge (8 vCPU, 16 GiB)</option>
              </optgroup>
              <optgroup label="Memory Optimized (R-Family)">
                <option value="r5.large">r5.large (2 vCPU, 16 GiB)</option>
                <option value="r5.xlarge">r5.xlarge (4 vCPU, 32 GiB)</option>
              </optgroup>
            {:else if selectedNode.data.provider === "azure"}
              <optgroup label="Burstable (B-Series)">
                <option value="Standard_B1s"
                  >Standard_B1s (1 vCPU, 1 GiB)</option
                >
                <option value="Standard_B2s"
                  >Standard_B2s (2 vCPU, 4 GiB)</option
                >
                <option value="Standard_B2ms"
                  >Standard_B2ms (2 vCPU, 8 GiB)</option
                >
                <option value="Standard_B4ms"
                  >Standard_B4ms (4 vCPU, 16 GiB)</option
                >
              </optgroup>
              <optgroup label="General Purpose (D-Series)">
                <option value="Standard_D2s_v3"
                  >Standard_D2s_v3 (2 vCPU, 8 GiB)</option
                >
                <option value="Standard_D4s_v3"
                  >Standard_D4s_v3 (4 vCPU, 16 GiB)</option
                >
                <option value="Standard_D8s_v3"
                  >Standard_D8s_v3 (8 vCPU, 32 GiB)</option
                >
              </optgroup>
              <optgroup label="Compute Optimized (F-Series)">
                <option value="Standard_F2s_v2"
                  >Standard_F2s_v2 (2 vCPU, 4 GiB)</option
                >
                <option value="Standard_F4s_v2"
                  >Standard_F4s_v2 (4 vCPU, 8 GiB)</option
                >
              </optgroup>
              <optgroup label="Memory Optimized (E-Series)">
                <option value="Standard_E2s_v3"
                  >Standard_E2s_v3 (2 vCPU, 16 GiB)</option
                >
                <option value="Standard_E4s_v3"
                  >Standard_E4s_v3 (4 vCPU, 32 GiB)</option
                >
              </optgroup>
            {:else}
              <optgroup label="Shared-core (e2, f1, g1)">
                <option value="e2-micro">e2-micro (2 vCPU, 1 GB)</option>
                <option value="e2-small">e2-small (2 vCPU, 2 GB)</option>
                <option value="e2-medium">e2-medium (2 vCPU, 4 GB)</option>
              </optgroup>
              <optgroup label="Standard (n1, n2)">
                <option value="n1-standard-1"
                  >n1-standard-1 (1 vCPU, 3.75 GB)</option
                >
                <option value="n1-standard-2"
                  >n1-standard-2 (2 vCPU, 7.5 GB)</option
                >
                <option value="n1-standard-4"
                  >n1-standard-4 (4 vCPU, 15 GB)</option
                >
                <option value="n2-standard-2"
                  >n2-standard-2 (2 vCPU, 8 GB)</option
                >
                <option value="n2-standard-4"
                  >n2-standard-4 (4 vCPU, 16 GB)</option
                >
              </optgroup>
              <optgroup label="High CPU (n1, n2)">
                <option value="n1-highcpu-2"
                  >n1-highcpu-2 (2 vCPU, 1.8 GB)</option
                >
                <option value="n1-highcpu-4"
                  >n1-highcpu-4 (4 vCPU, 3.6 GB)</option
                >
                <option value="n2-highcpu-2">n2-highcpu-2 (2 vCPU, 2 GB)</option
                >
              </optgroup>
              <optgroup label="High Memory (n1, n2)">
                <option value="n1-highmem-2"
                  >n1-highmem-2 (2 vCPU, 13 GB)</option
                >
                <option value="n2-highmem-2"
                  >n2-highmem-2 (2 vCPU, 16 GB)</option
                >
              </optgroup>
            {/if}
          </select>
        </div>
      {/if}

      {#if selectedNode.data.type === "kubernetes"}
        <div class="form-group">
          <label for="node-count">Node Count</label>
          <input
            id="node-count"
            type="number"
            value={selectedNode.data.count || 3}
            oninput={(e) => updateData("count", parseInt(e.target.value))}
            min="1"
            max="100"
          />
        </div>
      {/if}

      {#if selectedNode.data.label.includes("Instance") || selectedNode.data.label.includes("VM") || selectedNode.data.label.includes("Engine") || selectedNode.data.type === "disk"}
        <div class="form-group">
          <label for="disk-size">Disk Size (GB)</label>
          <input
            id="disk-size"
            type="number"
            value={selectedNode.data.disk || 20}
            oninput={(e) => updateData("disk", parseInt(e.target.value))}
            min="8"
            max="1024"
          />
        </div>
      {/if}

      {#if selectedNode.data.provider === "aviatrix"}
        <div class="form-group">
          <label for="asn">Local AS Number</label>
          <input
            id="asn"
            type="number"
            value={selectedNode.data.asn || 65000}
            oninput={(e) => updateData("asn", parseInt(e.target.value))}
          />
        </div>

        {#if selectedNode.data.label.includes("Spoke")}
          <div class="checkbox-group">
            <input
              id="ha"
              type="checkbox"
              checked={selectedNode.data.ha || false}
              onchange={(e) => updateData("ha", e.target.checked)}
            />
            <label for="ha">Enable High Availability (HA)</label>
          </div>
        {/if}
      {/if}
    </div>
  {:else if selectedEdge}
    <div class="drawer-header">
      <div class="header-info">
        <span class="provider-badge" style="color: var(--accent-primary)"
          >NETWORK RULE</span
        >
        <h3>Connection Settings</h3>
      </div>
      <button class="close-btn" onclick={closeDrawer}>
        <X size={20} />
      </button>
    </div>

    <div class="drawer-content">
      <div class="form-group">
        <label for="protocol">Traffic Protocol</label>
        <select
          id="protocol"
          value={selectedEdge.data?.protocol || "all"}
          onchange={(e) => updateEdgeData("protocol", e.target.value)}
        >
          <option value="all">All Traffic</option>
          <option value="tcp">TCP</option>
          <option value="udp">UDP</option>
          <option value="http">HTTP (Port 80)</option>
          <option value="https">HTTPS (Port 443)</option>
        </select>
      </div>

      {#if selectedEdge.data?.protocol === "tcp" || selectedEdge.data?.protocol === "udp"}
        <div class="form-group">
          <label for="port">Specific Port (or Range)</label>
          <input
            id="port"
            type="text"
            value={selectedEdge.data?.port || "*"}
            oninput={(e) => updateEdgeData("port", e.target.value)}
            placeholder="e.g., 8080 or 3000-4000"
          />
        </div>
      {/if}
    </div>
  {:else}
    <div class="empty-state">
      <p>
        Select a node or connection on the canvas to configure its properties
      </p>
    </div>
  {/if}
</aside>

<style>
  .property-drawer {
    width: 320px;
    height: 100%;
    position: absolute;
    right: -320px;
    top: 0;
    transition: right 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    border-radius: 0;
    border-top: none;
    border-bottom: none;
    border-right: none;
    background: rgba(15, 17, 21, 0.95);
    z-index: 40;
    display: flex;
    flex-direction: column;
  }

  .property-drawer.open {
    right: 0;
    box-shadow: -8px 0 32px rgba(0, 0, 0, 0.5);
  }

  .drawer-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 24px 20px 16px;
    border-bottom: 1px solid var(--border-color);
  }

  .header-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .provider-badge {
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 1px;
  }

  .drawer-header h3 {
    font-size: 1.1rem;
    font-weight: 600;
    margin: 0;
  }

  .close-btn {
    background: transparent;
    border: none;
    color: var(--text-muted);
    padding: 4px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .close-btn:hover {
    background: var(--bg-panel-hover);
    color: var(--text-main);
  }

  .drawer-content {
    padding: 24px 20px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    overflow-y: auto;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .form-group label {
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--text-muted);
  }

  .form-group input[type="text"],
  .form-group input[type="number"],
  .form-group select {
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    padding: 10px 12px;
    color: var(--text-main);
    font-size: 0.9rem;
    transition: all 0.2s;
    outline: none;
  }

  .form-group input:focus,
  .form-group select:focus {
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
    background: rgba(0, 0, 0, 0.4);
  }

  .form-group select option {
    background: var(--bg-dark);
    color: var(--text-main);
  }

  .checkbox-group {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 8px;
  }

  .checkbox-group input[type="checkbox"] {
    appearance: none;
    width: 18px;
    height: 18px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    background: rgba(0, 0, 0, 0.2);
    display: grid;
    place-content: center;
    cursor: pointer;
  }

  .checkbox-group input[type="checkbox"]::before {
    content: "";
    width: 10px;
    height: 10px;
    transform: scale(0);
    transition: 120ms transform ease-in-out;
    box-shadow: inset 1em 1em var(--accent-primary);
    background-color: var(--accent-primary);
    transform-origin: center;
    clip-path: polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%);
  }

  .checkbox-group input[type="checkbox"]:checked::before {
    transform: scale(1);
  }

  .checkbox-group label {
    font-size: 0.9rem;
    color: var(--text-main);
    cursor: pointer;
  }

  .empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px 24px;
    text-align: center;
    height: 100%;
    color: var(--text-muted);
    font-size: 0.9rem;
    line-height: 1.5;
  }
</style>
