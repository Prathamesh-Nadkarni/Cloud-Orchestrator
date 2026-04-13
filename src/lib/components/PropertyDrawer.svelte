<script>
  import { X, Shield, Plus, Trash2, Edit2, ShieldAlert } from "lucide-svelte";
  import { globalState } from "$lib/client/state.svelte";
  import { onMount } from "svelte";

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
          let strokeColor = "var(--text-main)";
          let dashArray = "none";
          let strokeWidth = 2;

          if (updatedEdge.data.dcfAction === "deny") {
            strokeColor = "#ea580c";
            dashArray = "5 5";
            updatedEdge.animated = false;
          } else {
            updatedEdge.animated = true;
            switch (updatedEdge.data.protocol) {
              case "http":
                strokeColor = "#3b82f6";
                dashArray = "5 5";
                break;
              case "https":
                strokeColor = "#10b981";
                break;
              case "tcp":
                strokeColor = "#f59e0b";
                break;
              case "udp":
                strokeColor = "#8b5cf6";
                dashArray = "4 8";
                break;
              default:
                strokeColor = "var(--text-main)";
                break;
            }
          }

          if (updatedEdge.data.expectedBandwidthMbps) {
            const bw = updatedEdge.data.expectedBandwidthMbps;
            if (bw > 20000) strokeWidth = 6;
            else if (bw > 5000) strokeWidth = 4;
            else if (bw > 1000) strokeWidth = 3;
          }

          if (updatedEdge.data.trafficPattern === "bursty") {
            dashArray = "10 5";
          }

          updatedEdge.style = `stroke: ${strokeColor}; stroke-width: ${strokeWidth}px; stroke-dasharray: ${dashArray};`;
          updatedEdge.markerEnd = { type: "arrowclosed", color: strokeColor };

          const protoLabel = (updatedEdge.data.protocol || "ALL").toUpperCase();
          const portLabel = updatedEdge.data.port || "*";
          updatedEdge.label = `${protoLabel} : ${portLabel}`;
          updatedEdge.labelStyle = `fill: ${strokeColor}; font-weight: 600; font-size: 12px;`;

          return updatedEdge;
        }
        return e;
      });
      selectedEdge.data[key] = value;
    }
  }

  let dcfRules = $state([]);
  let loadingRules = $state(false);

  $effect(() => {
    if (selectedNode && globalState.dcfModeEnabled) {
      fetchRulesForNode(selectedNode);
    }
  });

  async function fetchRulesForNode(node) {
    if (!globalState.currentDiagramId) return;
    loadingRules = true;
    try {
      const res = await fetch(
        `/api/security/policies/${globalState.currentDiagramId}`,
      );
      const data = await res.json();

      const nodeName = node.data.name || node.data.label;
      const nodeType = node.data.type;

      dcfRules = data.sortedRules.filter((rule) => {
        const srcMatch = rule.srcMatch.values.some(
          (v) => v === "ANY" || v === "*" || v === nodeName || v === nodeType,
        );
        const dstMatch = rule.dstMatch.values.some(
          (v) => v === "ANY" || v === "*" || v === nodeName || v === nodeType,
        );
        return srcMatch || dstMatch;
      });
    } catch (e) {
      console.error("Failed to fetch node rules", e);
    } finally {
      loadingRules = false;
    }
  }

  async function deleteRule(ruleId) {
    if (!confirm("Are you sure you want to delete this firewall rule?")) return;
    try {
      const res = await fetch(
        `/api/security/policies/${globalState.currentDiagramId}/rules/${ruleId}`,
        {
          method: "DELETE",
        },
      );
      if (res.ok) {
        dcfRules = dcfRules.filter((r) => r.id !== ruleId);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function quickAddRule(direction) {
    const nodeName = selectedNode.data.name || selectedNode.data.label;
    const newRule = {
      name: `${direction === "ingress" ? "Allow Inbound to" : "Allow Outbound from"} ${nodeName}`,
      priority: 1000,
      layer: "NETWORK",
      action: "ALLOW",
      protocol: "ANY",
      ports: [],
      srcMatch: { values: [direction === "ingress" ? "ANY" : nodeName] },
      dstMatch: { values: [direction === "ingress" ? nodeName : "ANY"] },
    };

    try {
      const res = await fetch(
        `/api/security/policies/${globalState.currentDiagramId}/rules`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newRule),
        },
      );
      if (res.ok) fetchRulesForNode(selectedNode);
    } catch (e) {
      console.error(e);
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

      <!-- Security Policies Section (DCF) -->
      {#if globalState.dcfModeEnabled}
        <div class="security-section">
          <div class="section-header">
            <div class="header-title">
              <ShieldAlert size={16} color="var(--accent-avx)" />
              <span>SECURITY POLICIES</span>
            </div>
            <div class="header-actions">
              <button
                class="add-rule-btn"
                onclick={() => quickAddRule("ingress")}
                title="Add Ingress Rule"
              >
                <Plus size={14} /> In
              </button>
              <button
                class="add-rule-btn"
                onclick={() => quickAddRule("egress")}
                title="Add Egress Rule"
              >
                <Plus size={14} /> Out
              </button>
            </div>
          </div>

          {#if loadingRules}
            <div class="rules-loading">Loading policies...</div>
          {:else if dcfRules.length > 0}
            <div class="rules-list">
              {#each dcfRules as rule}
                <div class="rule-card" class:deny={rule.action === "DENY"}>
                  <div class="rule-top">
                    <span class="rule-priority">#{rule.priority}</span>
                    <span
                      class="rule-action"
                      class:allow={rule.action === "ALLOW"}>{rule.action}</span
                    >
                    <div class="rule-ops">
                      <button onclick={() => deleteRule(rule.id)}
                        ><Trash2 size={12} /></button
                      >
                    </div>
                  </div>
                  <div class="rule-name">{rule.name}</div>
                  <div class="rule-flow">
                    <span>{rule.srcMatch.values.join(", ")}</span>
                    <ChevronRight size={10} />
                    <span>{rule.dstMatch.values.join(", ")}</span>
                  </div>
                </div>
              {/each}
            </div>
          {:else}
            <div class="rules-empty">No policies targeting this resource.</div>
          {/if}
        </div>
      {/if}

      <!-- AI Workload Metadata -->
      {#if selectedNode.data.provider === "ai"}
        <div
          class="form-group"
          style="margin-top: 12px; border-top: 1px solid var(--border-color); padding-top: 12px;"
        >
          <label for="data-sensitivity">Data Sensitivity</label>
          <select
            id="data-sensitivity"
            value={selectedNode.data.dataSensitivity || "internal"}
            onchange={(e) => updateData("dataSensitivity", e.target.value)}
          >
            <option value="public">Public</option>
            <option value="internal">Internal</option>
            <option value="confidential">Confidential</option>
            <option value="regulated">Regulated</option>
          </select>
        </div>

        <div class="form-group">
          <label for="auth-mode">Authentication Mode</label>
          <select
            id="auth-mode"
            value={selectedNode.data.authMode || "none"}
            onchange={(e) => updateData("authMode", e.target.value)}
          >
            <option value="none">None</option>
            <option value="apiKey">API Key</option>
            <option value="mTLS">mTLS</option>
            <option value="IAM">IAM</option>
            <option value="OAuth">OAuth</option>
          </select>
        </div>

        <div class="checkbox-group">
          <input
            id="contains-pii"
            type="checkbox"
            checked={selectedNode.data.containsPII || false}
            onchange={(e) => updateData("containsPII", e.target.checked)}
          />
          <label for="contains-pii">Contains PII</label>
        </div>

        <div class="checkbox-group">
          <input
            id="redaction-enabled"
            type="checkbox"
            checked={selectedNode.data.redactionEnabled || false}
            onchange={(e) => updateData("redactionEnabled", e.target.checked)}
          />
          <label for="redaction-enabled">Data Redaction Enabled</label>
        </div>

        <div class="checkbox-group">
          <input
            id="internet-reachable"
            type="checkbox"
            checked={selectedNode.data.internetReachable || false}
            onchange={(e) => updateData("internetReachable", e.target.checked)}
          />
          <label for="internet-reachable">Internet Reachable</label>
        </div>
      {/if}

      <!-- Capacity Metadata -->
      <div
        class="form-group"
        style="margin-top: 12px; border-top: 1px solid var(--border-color); padding-top: 12px;"
      >
        <label for="expected-bandwidth">Expected Bandwidth (Mbps)</label>
        <input
          id="expected-bandwidth"
          type="number"
          min="0"
          value={selectedNode.data.expectedBandwidthMbps || ""}
          oninput={(e) =>
            updateData("expectedBandwidthMbps", parseInt(e.target.value))}
          placeholder="e.g. 1000"
        />
      </div>

      <!-- Multicloud Routing -->
      <div
        class="form-group"
        style="margin-top: 12px; border-top: 1px solid var(--border-color); padding-top: 12px;"
      >
        <div class="checkbox-group">
          <input
            id="requires-ha"
            type="checkbox"
            checked={selectedNode.data.requiresHA || false}
            onchange={(e) => updateData("requiresHA", e.target.checked)}
          />
          <label for="requires-ha">Requires High Availability (HA)</label>
        </div>

        <label for="bgp-asn" style="margin-top: 8px; display: block;"
          >BGP ASN (optional)</label
        >
        <input
          id="bgp-asn"
          type="number"
          min="1"
          max="4294967295"
          value={selectedNode.data.bgpAsn || ""}
          oninput={(e) => updateData("bgpAsn", parseInt(e.target.value))}
          placeholder="e.g. 65001"
        />
      </div>
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

      <div
        class="form-group"
        style="margin-top: 12px; border-top: 1px solid var(--border-color); padding-top: 12px;"
      >
        <label for="dcf-action" style="color: var(--accent-avx);"
          >Aviatrix DCF Enforcement</label
        >
        <select
          id="dcf-action"
          value={selectedEdge.data?.dcfAction || "none"}
          onchange={(e) => updateEdgeData("dcfAction", e.target.value)}
        >
          <option value="none">No Policy (Passthrough)</option>
          <option value="allow">Explicit Allow</option>
          <option value="deny">Explicit Deny (Drop Traffic)</option>
        </select>
        <p
          style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;"
        >
          Simulate how Distributed Cloud Firewall policies affect the traffic
          flow between these nodes.
        </p>
      </div>

      <!-- AI Edge Metadata -->
      <div
        class="form-group"
        style="margin-top: 12px; border-top: 1px solid var(--border-color); padding-top: 12px;"
      >
        <label for="traffic-class">Traffic Class (AI)</label>
        <select
          id="traffic-class"
          value={selectedEdge.data?.trafficClass || "sync"}
          onchange={(e) => updateEdgeData("trafficClass", e.target.value)}
        >
          <option value="sync">General Sync</option>
          <option value="inference">Inference (Low Latency)</option>
          <option value="training">Training (High Throughput)</option>
          <option value="embedding">Embedding</option>
          <option value="admin">Admin / Control</option>
          <option value="telemetry">Telemetry</option>
        </select>
      </div>

      <div class="form-group">
        <label for="payload-type">Payload Type</label>
        <select
          id="payload-type"
          value={selectedEdge.data?.payloadType || "metadata"}
          onchange={(e) => updateEdgeData("payloadType", e.target.value)}
        >
          <option value="metadata">Standard Data</option>
          <option value="prompts">Prompts</option>
          <option value="embeddings">Embeddings</option>
          <option value="modelWeights">Model Weights</option>
          <option value="trainingData">Training Data</option>
        </select>
      </div>

      <!-- Capacity Edge Metadata -->
      <div class="form-group">
        <label for="expected-edge-bandwidth"
          >Expected Edge Bandwidth (Mbps)</label
        >
        <input
          id="expected-edge-bandwidth"
          type="number"
          min="0"
          value={selectedEdge.data?.expectedBandwidthMbps || ""}
          oninput={(e) =>
            updateEdgeData("expectedBandwidthMbps", parseInt(e.target.value))}
          placeholder="e.g. 500"
        />
      </div>

      <div class="form-group">
        <label for="max-latency">Max Allowed Latency (ms)</label>
        <input
          id="max-latency"
          type="number"
          min="0"
          value={selectedEdge.data?.maxLatencyMs || ""}
          oninput={(e) =>
            updateEdgeData("maxLatencyMs", parseInt(e.target.value))}
          placeholder="e.g. 50"
        />
      </div>

      <div class="form-group">
        <label for="monthly-transfer">Expected Monthly Egress (GB)</label>
        <input
          id="monthly-transfer"
          type="number"
          min="0"
          value={selectedEdge.data?.monthlyTransferGB || ""}
          oninput={(e) =>
            updateEdgeData("monthlyTransferGB", parseInt(e.target.value))}
          placeholder="e.g. 1000"
        />
      </div>

      <div class="form-group">
        <label for="routing-protocol">Routing Protocol</label>
        <select
          id="routing-protocol"
          value={selectedEdge.data?.routingProtocol || "static"}
          onchange={(e) => updateEdgeData("routingProtocol", e.target.value)}
        >
          <option value="static">Static Routing</option>
          <option value="bgp">BGP</option>
          <option value="ospf">OSPF</option>
        </select>
      </div>
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

  /* DCF Rules Section Styles */
  .security-section {
    margin-top: 12px;
    border-top: 1px solid var(--border-color);
    padding-top: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .header-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--text-muted);
    letter-spacing: 0.05em;
  }

  .header-actions {
    display: flex;
    gap: 4px;
  }

  .add-rule-btn {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    padding: 2px 6px;
    color: var(--text-main);
    font-size: 0.7rem;
    display: flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
  }

  .add-rule-btn:hover {
    background: var(--bg-panel-hover);
    border-color: var(--accent-avx);
  }

  .rules-loading,
  .rules-empty {
    font-size: 0.8rem;
    color: var(--text-muted);
    text-align: center;
    padding: 12px;
    background: rgba(0, 0, 0, 0.1);
    border-radius: 6px;
  }

  .rules-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .rule-card {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .rule-card.deny {
    border-left: 3px solid #ea580c;
  }

  .rule-top {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .rule-priority {
    font-size: 0.7rem;
    font-weight: 700;
    color: var(--text-muted);
  }

  .rule-action {
    font-size: 0.65rem;
    font-weight: 800;
    padding: 2px 6px;
    border-radius: 4px;
    background: #451a03;
    color: #fb923c;
  }

  .rule-action.allow {
    background: #022c22;
    color: #4ade80;
  }

  .rule-ops {
    margin-left: auto;
    display: flex;
    gap: 4px;
  }

  .rule-ops button {
    background: transparent;
    border: none;
    color: var(--text-muted);
    padding: 2px;
    cursor: pointer;
    border-radius: 4px;
  }

  .rule-ops button:hover {
    color: #f87171;
    background: rgba(248, 113, 113, 0.1);
  }

  .rule-name {
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--text-main);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .rule-flow {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.75rem;
    color: var(--text-muted);
  }
</style>
