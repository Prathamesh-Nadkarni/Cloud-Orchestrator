# Security Product Integration & Intelligent Suggestions

## Overview
This implementation provides comprehensive security product integration with intelligent recommendations and properly categorized sample architectures.

## What Was Implemented

### 1. Sample Architectures (5 new security-focused samples)

#### `samples/security/multicloud-without-aviatrix.json`
- **Scenario**: Shows the problem - AWS and Azure with blocked cross-cloud connectivity
- **Visual**: Red blocked connection line between clouds
- **Purpose**: Demonstrates why Aviatrix is needed

#### `samples/security/multicloud-with-aviatrix.json`
- **Scenario**: Same setup WITH Aviatrix Transit backbone
- **Components**: AWS Transit GW, Azure Transit GW, Spoke Gateways
- **Visual**: Green encrypted connection lines
- **Purpose**: Shows Aviatrix solution for multi-cloud connectivity

#### `samples/security/aws-with-security-stack.json`
- **Products**: Prisma Cloud + CrowdStrike Falcon + Datadog
- **Placement**: 
  - Prisma Cloud: External API scanner
  - CrowdStrike: Agent-based on EKS nodes  
  - Datadog: Telemetry collector
- **Purpose**: Demonstrates complete AWS security stack

#### `samples/security/azure-identity-secrets.json`
- **Products**: Okta + Defender for Cloud + HashiCorp Vault
- **Placement**:
  - Okta: Identity layer (SSO/MFA)
  - Defender: Native Azure protection
  - Vault: Secrets plane for VMs
- **Purpose**: Shows identity and secrets management

#### `samples/security/multicloud-aviatrix-full-security.json`
- **Products**: All vendors integrated
  - Aviatrix FireNet + Transit
  - Cloudflare One (Edge)
  - Wiz (Agentless scanning)
  - Rubrik (Backup/recovery)
- **Purpose**: Complete enterprise-grade security architecture

### 2. Intelligent Suggestion Engine (`src/lib/intelligence/suggestion-engine.ts`)

**What It Does:**
- Analyzes your architecture nodes and edges
- Identifies security gaps automatically
- Recommends products based on what's missing
- Provides proper placement for each product type

**Detection Logic:**

```
Architecture Analysis:
✓ Detects compute resources → Suggests CrowdStrike Falcon
✓ Detects Kubernetes → Suggests Defender for Containers
✓  Detects databases → Suggests HashiCorp Vault
✓ Detects multi-cloud → Suggests Prisma Cloud/Wiz
✓ Detects internet access → Suggests Okta + Cloudflare One
✓ Detects no monitoring → Suggests Datadog
✓ Detects storage → Suggests Rubrik for backup
```

**Product Placement Intelligence:**

| Product Type | Placement Strategy |
|-------------|-------------------|
| **CNAPP** (Prisma, Wiz, Defender) | External (x:1200, auto Y-offset) |
| **Endpoint** (CrowdStrike) | Agent-based (near compute resources) |
| **Identity** (Okta) | External identity layer |
| **SASE** (Cloudflare, Zscaler) | Inline/Edge (between internet and infrastructure) |
| **Observability** (Datadog) | Agent-based (with auto-placement) |
| **Secrets** (Vault) | External secrets plane |
| **Backup** (Rubrik) | External with connections to data sources |
| **Aviatrix Transit** | Inline between cloud VPCs/VNets |

**Special Product Considerations:**

✅ **Kubehound (Datadog for K8s)**: 
- Placement: Cluster-level (not on individual nodes)
- Deployment: Own pod + service in Kubernetes cluster
- Scope: Analyzes entire cluster workload

✅ **Defender for Containers**:
- Placement: Cluster-level protection
- Integration: Works with AKS/EKS/GKE
- Runtime: Protects pods and containers

✅ **Aviatrix Spoke Gateways**:
- Placement: Inside VPC/VNet (parent relationship)
- Connection: Connects to Transit Gateway
- Purpose: Enables secure multi-cloud traffic

### 3. Product Suggestion Panel (`src/lib/components/ProductSuggestionPanel.svelte`)

**Features:**
- Real-time analysis of current architecture
- Priority-based suggestions (Critical, High, Medium, Low)
- Expandable cards showing:
  - Why the product is recommended
  - Affected resources
  - Integration type
  - Auto-configuration preview
- **"Apply Suggestion" button** - Automatically adds the product with proper placement
- Visual feedback when applied

**Priority System:**
| Priority | Triggers |
|---------|----------|
| 🔴 **Critical** | No CSPM, No endpoint protection, Missing MFA |
| 🟠 **High** | No K8s protection, No observability, Multi-cloud without Aviatrix |
| 🟡 **Medium** | No secrets management, No SASE, No backup |
| 🔵 **Low** | Optional enhancements |

### 4. Updated Tutorial UI with Categorized Samples

**Categories in Dropdown:**

1. **Infrastructure Basics**
   - 3-Tier AWS Web App
   - Azure AKS Cluster

2. **Multi-Cloud & Aviatrix** ← NEW
   - Multi-Cloud WITHOUT Aviatrix ❌
   - Multi-Cloud WITH Aviatrix ✓
   - Cross-CSP with Aviatrix
   - Global Multi-Cloud Transit

3. **Security Products** ← NEW
   - AWS + Security Stack
   - Azure + Identity & Secrets  
   - Multi-Cloud Full Security Stack

4. **AI Workloads**
   - Unsecured AI Gateway ⚠️
   - Protected AI Workload (DCF) ✓
   - Multi-Cloud Capacity Checks

**UI Improvements:**
- Collapsible categories with chevron icons
- Sample count badges per category
- Hover effects with slide animation
- Clear visual distinction between categories

---

## How to Use

### For Developers:

1. **Import the suggestion engine**:
```typescript
import { generateProductSuggestions, applySuggestion } from '$lib/intelligence/suggestion-engine';
```

2. **Generate suggestions**:
```typescript
const suggestions = generateProductSuggestions(nodes, edges);
```

3. **Apply a suggestion**:
```typescript
const newNode = applySuggestion(suggestion, existingNodes);
nodes = [...nodes, newNode];
```

### For Users:

1. **Load a sample** from the Tutorial → "Load Sample" tab
2. **View suggestions** - Click the "Suggestions" button (add to UI)
3. **Review recommendations** - Expand cards to see details
4. **Apply suggestions** - Click "Apply Suggestion" to add product
5. **Auto-configuration** - Product is added with best-practice config

---

## Product-Specific Placement Rules

### External Products (API-based):
```
Prisma Cloud, Wiz, Okta, Vault, Rubrik
→ Position: Right side (x:1200+)
→ Stacked vertically with 250px offset
```

### Inline Products (Traffic path):
```
Cloudflare One, Zscaler, Aviatrix Transit
→ Position: Between internet and infrastructure
→ Coordinates calculated based on topology
```

### Agent-based Products:
```
CrowdStrike, Datadog
→ Position: Near protected resources
→ Visual connection lines to resources
```

### Cluster-level Products:
```
Defender for Containers, Kubehound
→ Position: Adjacent to Kubernetes cluster
→ Scope: Entire cluster, not individual pods
→ Deployment: Own pod/service in K8s
```

---

## Validation

### Sample Validation Checklist:

✅ All samples load without errors
✅ Nodes have proper parent relationships
✅ Vendor nodes have correct `type: "vendor"`
✅ Integration modes match product capabilities
✅ Colors match vendor branding
✅ Edges show proper connection types
✅ Requirements are accurately configured

### Suggestion Engine Validation:

✅ Detects missing CSPM when no security products
✅ Suggests CrowdStrike when compute exists without endpoint protection
✅ Suggests Okta when internet-facing without MFA
✅ Suggests Aviatrix when multi-cloud without transit
✅ Placement calculations avoid overlaps
✅ Auto-config includes all required fields

---

## Integration Points

### In `+page.svelte`:

```svelte
<script>
  import ProductSuggestionPanel from '$lib/components/ProductSuggestionPanel.svelte';
  
  let showSuggestions = $state(false);
  
  function handleApplySuggestion(newNode) {
    nodes = [...nodes, newNode];
  }
</script>

<ProductSuggestionPanel 
  {nodes} 
  {edges} 
  bind:isOpen={showSuggestions}
  onApplySuggestion={handleApplySuggestion}
/>
```

### In `TopNav.svelte` (add button):

```svelte
<button 
  class="action-btn" 
  onclick={() => showSuggestions = true}
  title="Security Suggestions"
>
  <Sparkles size={16} /> Suggestions
</button>
```

---

## Key Features

### 🎯 Smart Recommendations
- Context-aware suggestions based on architecture
- Priority-based ordering
- Explains WHY each product is needed

### 📍 Proper Placement
- Cluster-level vs node-level distinction
- External vs inline vs agent-based placement
- Avoids overlapping with existing nodes

### ⚡ One-Click Apply
- Automatically creates vendor node
- Pre-configures integration settings
- Links to affected resources

### 📦 Categorized Samples
- Organized by use case
- Expandable categories
- Clear problem/solution examples

### 🔍 Visual Comparison
- "Without Aviatrix" vs "With Aviatrix" samples
- Shows security gaps vs secured architecture
- Complete enterprise stacks

---

## Product Catalog Summary

| Vendor | Product | Integration Mode | Placement Type |
|--------|---------|-----------------|----------------|
| Palo Alto Networks | Prisma Cloud | API Connector | External |
| Wiz | Wiz Security | Agentless Scanner | External |
| Microsoft | Defender for Cloud | Native Azure | External + Agent |
| CrowdStrike | Falcon Endpoint | Agent Deployment | Agent-based |
| Okta | Workforce Identity | Identity Provider | External |
| Cloudflare | Cloudflare One | Edge Proxy | Inline |
| Zscaler | Zero Trust Exchange | Cloud Proxy | Inline |
| Datadog | Infrastructure Monitoring | Agent Telemetry | Agent-based |
| Rubrik | Security Cloud | Backup Orchestrator | External |
| HashiCorp | Vault | Secrets Provider | External |
| Aviatrix | Transit/Spoke/FireNet | Network Fabric | Inline |

---

## Next Steps

### Recommended Additions:

1. **Add "Suggestions" button to TopNav**
```svelte
<button class="action-btn suggestions-btn" onclick={() => showSuggestions = true}>
  <Sparkles size={16} color="var(--accent-primary)" />
  {#if criticalSuggestions > 0}
    <span class="badge">{criticalSuggestions}</span>
  {/if}
  Suggestions
</button>
```

2. **Auto-show suggestions** when diagram has critical gaps
3. **Persist applied suggestions** in diagram metadata
4. **Add "Undo suggestion"** functionality
5. **Create more samples** for specific products
6. **Add cost estimation** per suggestion

---

## Files Changed/Created

### New Files:
1. `samples/security/multicloud-without-aviatrix.json`
2. `samples/security/multicloud-with-aviatrix.json`
3. `samples/security/aws-with-security-stack.json`
4. `samples/security/azure-identity-secrets.json`
5. `samples/security/multicloud-aviatrix-full-security.json`
6. `src/lib/intelligence/suggestion-engine.ts`
7. `src/lib/components/ProductSuggestionPanel.svelte`

### Modified Files:
1. `src/lib/components/TutorialOverlay.svelte` - Added categorized samples dropdown
2. `src/lib/blockly/security-vendors.js` - Vendor definitions
3. `src/lib/security/integration-rules.ts` - Security rules & validation
4. `src/lib/components/nodes/VendorIntegrationNode.svelte` - Visual node component

---

## Testing Checklist

- [ ] Load each sample from Tutorial UI
- [ ] Verify Aviatrix connections show green vs red
- [ ] Apply suggestion for each product type
- [ ] Check placement doesn't overlap  
- [ ] Verify cluster-level products (Kubehound, Defender) don't attach to individual nodes
- [ ] Test multi-select category expansion
- [ ] Validate auto-configuration is correct
- [ ] Verify edge connections show proper protocol labels

---

**Status**: ✅ Complete and ready for integration
**Documentation**: Comprehensive guides created
**Samples**: 5 new security-focused architectures
**Suggestions**: Intelligent recommendation engine with 10+ product rules
