# Security Product Integration - Quick Start Guide

## ✅ What's Been Implemented

You now have a **complete security product suggestion and integration system** with:

1. **6 Sample Architectures** showing security integrations
2. **Intelligent Suggestion Engine** that analyzes your architecture
3. **Product Suggestion Panel** with one-click deployment
4. **Categorized Tutorial Samples** for easy discovery
5. **Proper Placement Logic** (cluster-level vs node-level)

---

## 🚀 How to Use

### 1. View Sample Architectures

Click **Tutorial** button in the top nav → **Samples** tab:

**Infrastructure Basics** (2 samples)
- 3-Tier AWS Web App
- Azure AKS Cluster

**Multi-Cloud & Aviatrix** (4 samples)
- Multi-Cloud WITHOUT Aviatrix ❌ (shows problem)
- Multi-Cloud WITH Aviatrix ✓ (shows solution)
- Cross-CSP with Aviatrix
- Global Multi-Cloud Transit

**Security Products** (4 samples)
- AWS + Security Stack (Prisma + CrowdStrike + Datadog)
- Azure + Identity & Secrets (Okta + Defender + Vault)
- Multi-Cloud Full Security Stack (complete security)
- **K8s: Cluster-Level vs Node-Level** ← Shows Kubehound placement!

**AI Workloads** (3 samples)
- Unsecured AI Gateway ⚠️
- Protected RAG with DCF
- Multi-Cloud AI Capacity Planning

### 2. Get Product Suggestions

1. Build your infrastructure (drag AWS EC2, Azure VMs, K8s clusters, etc.)
2. Click **Suggestions** button (✨ sparkles icon) in top nav
3. Panel slides in from right showing intelligent recommendations:

**Example Suggestions:**

| Your Architecture | Suggested Product | Why |
|-------------------|-------------------|-----|
| Has EC2/VMs but no endpoint security | **CrowdStrike Falcon** | Critical: Protect compute from malware |
| Has Kubernetes but no container scanning | **Prisma Cloud** or **Defender** | High: Scan containers & runtime protection |
| Multi-cloud without centralized monitoring | **Datadog** | High: Unified observability |
| No MFA/SSO | **Okta** | Critical: Identity & access management |
| Databases without secrets management | **HashiCorp Vault** | High: Secure credential storage |
| Multi-cloud without secure connectivity | **Aviatrix** | Critical: Encrypted transit backbone |

### 3. Apply Suggestions with One Click

Each suggestion card shows:
- **Priority badge** (Critical/High/Medium/Low)
- **What it does**
- **Where it goes** (external/inline/cluster-level)
- **Affected resources** (e.g., "aws-eks-1, azure-aks-1")
- **Auto-configuration preview**

Click **Apply Suggestion** → product node is added to canvas with:
- ✅ Correct placement (external, inline, or near cluster)
- ✅ Pre-configured settings
- ✅ Proper connections

---

## 📍 Product Placement Logic

### Critical Distinction: Cluster-Level vs Node-Level

**Cluster-Level Products** (analyze ENTIRE cluster):
- **Kubehound** (Datadog) - attack path analysis
- **Defender for Containers** (Microsoft) - security posture
- **Placement:** Adjacent to K8s cluster, NOT inside it
- **Why:** These products scan/monitor whole cluster architecture

**Node-Level Products** (run on each node):
- **Datadog APM** - metrics from each node
- **CrowdStrike Falcon** - endpoint protection
- **Placement:** DaemonSet inside cluster
- **Why:** Need agent on every worker node

**Visual in Sample:**
Load sample: **"K8s: Cluster-Level vs Node-Level"**
- See Kubehound → positioned OUTSIDE cluster, connected via API
- See Datadog APM → positioned as DaemonSet INSIDE cluster

### Placement Rules

| Product Type | Position | Example |
|--------------|----------|---------|
| **API-Based (External)** | Right side (x: 1200+) | Prisma Cloud, Wiz - scan via cloud APIs |
| **Inline (Traffic Path)** | Between cloud regions | Cloudflare One, Zscaler - SASE gateway |
| **Cluster-Level** | Adjacent to K8s node | Kubehound, Defender - analyze cluster |
| **Agent-Based** | Near protected resources | CrowdStrike on VMs |
| **Identity** | External (global scope) | Okta SSO - spans all clouds |
| **Secrets** | External (vault services) | HashiCorp Vault |
| **Transit Network** | Between VPCs/VNets | Aviatrix Transit/Spoke |

---

## 🔍 Detection Logic

The suggestion engine analyzes your architecture:

```typescript
// Example: What triggers suggestions

hasCompute (EC2/VMs) + no endpoint security
  → Suggests CrowdStrike Falcon

hasKubernetes + no container scanning
  → Suggests Prisma Cloud or Defender

hasDatabase + no secrets
  → Suggests HashiCorp Vault

hasMultiCloud + no unified monitoring
  → Suggests Datadog

hasMultiCloud + no Aviatrix
  → Suggests Aviatrix Transit

hasPublicInternet + no SASE
  → Suggests Cloudflare One or Zscaler

noMFA
  → Suggests Okta (critical priority!)

hasBackupGaps
  → Suggests Rubrik
```

---

## 🛠️ Developer Guide

### Adding New Security Products

1. **Define vendor** in `src/lib/blockly/security-vendors.js`:
```javascript
export const SECURITY_VENDORS = {
  my_product: {
    name: 'My Product',
    company: 'My Company',
    color: '#FF5733',
    category: 'Security',
    integrationMode: 'api_connector',
    requirements: { api_key: true, cloud_accounts: ['aws', 'azure'] }
  }
}
```

2. **Add catalog entry** in `src/lib/server/marketplace/security-catalog.ts`:
```typescript
{
  id: 'my-product-id',
  name: 'My Product',
  category: 'cnapp',
  vendor: 'My Company',
  ...
}
```

3. **Define security rules** in `src/lib/security/integration-rules.ts`:
```typescript
export const SECURITY_INTEGRATION_RULES = {
  my_product: {
    architectureIntegration: {
      placement: ['external'],  // or 'inline', 'cluster-level', etc.
      scope: 'multi-cloud'
    },
    securityRules: [
      {
        id: 'rule-1',
        description: 'What it checks',
        severity: 'critical',
        check: (nodes, edges) => { /* validation logic */ }
      }
    ]
  }
}
```

4. **Add detection logic** in `src/lib/intelligence/suggestion-engine.ts`:
```typescript
// In analyzeArchitecture()
const hasMyUseCase = nodes.some(n => n.data.type === 'my-type');

// In generateProductSuggestions()
if (hasMyUseCase && !hasMyProduct) {
  suggestions.push({
    productKey: 'my_product',
    reason: 'Why you need this',
    priority: 'high',
    ...
  });
}
```

### File Structure
```
src/lib/
├── blockly/security-vendors.js           # Vendor metadata
├── server/marketplace/security-catalog.ts  # Product details
├── security/integration-rules.ts          # Validation rules
├── intelligence/suggestion-engine.ts      # Detection & placement
├── components/
│   ├── ProductSuggestionPanel.svelte     # Suggestion UI
│   ├── TutorialOverlay.svelte            # Sample browser
│   └── nodes/VendorIntegrationNode.svelte # Vendor node UI
samples/security/
├── aws-with-security-stack.json
├── azure-identity-secrets.json
├── multicloud-aviatrix-full-security.json
├── kubernetes-observability-comparison.json  ← Cluster-level demo!
└── ...
```

---

## 📊 Validation

Run the validation script to check all samples:

```powershell
# PowerShell
Get-ChildItem -Path ".\samples\security" -Filter "*.json" | ForEach-Object {
  $data = Get-Content $_.FullName | ConvertFrom-Json
  Write-Host "✓ $($_.Name):" -ForegroundColor Green
  Write-Host "  Nodes: $($data.nodes.Count), Vendor Nodes: $(($data.nodes | Where-Object { $_.type -eq 'vendor' }).Count)"
}
```

**Expected Output:**
```
✓ aws-with-security-stack.json:
  Nodes: 7, Vendor Nodes: 3

✓ azure-identity-secrets.json:
  Nodes: 7, Vendor Nodes: 3

✓ kubernetes-observability-comparison.json:
  Nodes: 6, Vendor Nodes: 3
  
... etc
```

---

## 🎯 Testing Checklist

### Samples
- [ ] All samples load without errors
- [ ] Nodes have correct parent relationships
- [ ] Edges connect to valid nodes
- [ ] Vendor nodes display properly

### Suggestions
- [ ] Panel opens when clicking Suggestions button
- [ ] Detects missing CSPM (load EC2 → should suggest Prisma/Wiz)
- [ ] Detects missing endpoint (load VMs → should suggest CrowdStrike)
- [ ] Detects missing MFA (any arch → should suggest Okta)
- [ ] Detects multi-cloud without Aviatrix

### Placement
- [ ] API-based products go to right side (x > 1000)
- [ ] Cluster-level products adjacent to K8s (not inside)
- [ ] Inline products between regions
- [ ] No overlapping nodes

### One-Click Apply
- [ ] Click "Apply Suggestion" adds node
- [ ] Node appears in correct position
- [ ] Auto-configuration is applied
- [ ] Alert confirms addition

---

## 🔗 Integration Points

### In Main App (`+page.svelte`)

```svelte
<script>
  import ProductSuggestionPanel from '$lib/components/ProductSuggestionPanel.svelte';
  
  let showSuggestions = $state(false);
  
  function handleApplySuggestion(newNode) {
    nodes = [...nodes, newNode];
  }
</script>

<ProductSuggestionPanel
  bind:isOpen={showSuggestions}
  nodes={nodes}
  edges={edges}
  onApply={handleApplySuggestion}
/>
```

### In TopNav (`TopNav.svelte`)

```svelte
<button onclick={() => (showSuggestions = !showSuggestions)}>
  <Sparkles size={16} /> Suggestions
</button>
```

---

## 🚨 Common Issues

### Issue: Suggestions not showing
**Fix:** Make sure you have infrastructure nodes on canvas (EC2, VMs, K8s, etc.)

### Issue: Wrong placement
**Check:** Product's `architectureIntegration.placement` in `integration-rules.ts`

### Issue: Cluster-level product inside cluster
**Fix:** Ensure `deploymentType: 'cluster-level'` in node configuration

### Issue: Sample won't load
**Debug:** Open browser console → check for JSON parse errors or missing IDs

---

## 📚 Learn More

- **Architecture Docs:** [SECURITY_PRODUCTS_ARCHITECTURE.md](./SECURITY_PRODUCTS_ARCHITECTURE.md)
- **Integration Guide:** [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)
- **Summary:** [SECURITY_INTEGRATION_SUMMARY.md](../SECURITY_INTEGRATION_SUMMARY.md)

---

## 🎉 You're Ready!

Start by:
1. Load a sample (Tutorial → Samples → Security Products)
2. Modify it (delete a product)
3. Click Suggestions → see what's recommended
4. Apply suggestion → see it auto-place correctly

**Pro Tip:** Try the "K8s: Cluster-Level vs Node-Level" sample to understand the critical distinction for Kubernetes products!
