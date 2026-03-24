# Cloud Orchestrator

A visual, drag-and-drop platform to design multi-cloud architectures, enforce security policies, and generate production-ready Terraform & Kubernetes manifests — all from a single canvas.

[**Live Preview**](https://prathamesh-nadkarni.github.io/Cloud-Orchestrator/) | [**Feature Guide**](./docs/FEATURES.md) | [**Architecture Roadmap**](./ARCHITECTURE.md) | [**Operations Guide**](./OPERATIONS.md)

---

## What It Does

Cloud Orchestrator turns architectural diagrams into deployable infrastructure. Design visually, validate security, and export code — no context-switching between drawing tools and text editors.

---

## Core Features

### Visual Multi-Cloud Canvas
- Drag-and-drop workspace for **AWS, Azure, GCP, Kubernetes, Aviatrix, and AI workloads**
- Hierarchical nesting: VPCs → Subnets → Security Groups → Compute, with provider-matching rules
- **3D Isometric View** toggle for Cloudcraft-style volumetric rendering
- Real-time **cost estimation** badge with per-resource breakdown

### Smart Drag & Drop
- **Drop-zone highlighting** — when dragging a resource, valid placement targets glow with a pulsing border
- Vendor security products respect hierarchy: `inside_vpc` products only highlight VPCs; `external` products highlight the canvas
- Confirmation dialogs prevent accidental nesting errors

### 10 Security Vendor Integrations
Built-in support for enterprise security products with correct placement hierarchy:

| Vendor | Placement | Purpose |
|--------|-----------|---------|
| Prisma Cloud | External | Cloud Security Posture Management |
| CrowdStrike Falcon | Inside VPC | Endpoint Detection & Response |
| Okta | External | Identity & SSO/MFA |
| HashiCorp Vault | Inside VPC | Secrets Management |
| Cloudflare One | Inside VPC | Zero-Trust Network Access |
| Zscaler ZIA/ZPA | Inside VPC | Secure Web Gateway |
| Wiz | External | Agentless Cloud Security |
| Datadog | Inside VPC | Monitoring & Observability |
| Rubrik | External | Backup & Recovery |
| Microsoft Defender | Inside VPC | Cloud Workload Protection |

### Intelligent Product Suggestions
- AI-powered analysis identifies security gaps in your architecture
- Recommendations ranked by priority: Critical, High, Recommended, Optional
- One-click **Apply Suggestion** adds products with correct placement and hierarchy

### Security Simulation Engine
- Graph-based audit evaluating **15+ security rules** across all network paths
- Vulnerability detection: unencrypted flows, exposed ports, direct internet access to databases
- **DCF policy enforcement**: Aviatrix Distributed Cloud Firewall rules block violating traffic
- Color-coded edges: 🟢 Secure · 🔴 Vulnerable · 🟠 Blocked by DCF
- Full simulation report with risk metrics and remediation guidance

### Bi-directional Terraform
- **Generate** `main.tf` and `k8s.yaml` from your visual diagram
- **Import `.tf` files** to auto-reconstruct the canvas from Terraform resource blocks
- Built-in dark-themed editor with **Sync to Canvas** for manual edits

### Persistence & Versioning
- Save diagrams to a PostgreSQL/Prisma backend
- Browse and restore immutable version snapshots
- Sync status indicator: Synced / Diverged / Draft

### Deployment Lifecycle
- Plan, Apply, and Destroy operations from the browser
- Policy engine evaluation before execution
- MFA escalation for security-sensitive deployments

### Governance & Marketplace
- Admin approval workflows and audit logging
- Vendor marketplace for browsing and installing integrations
- Append-only audit registry for compliance

### 13 Sample Architectures
Pre-built diagrams across four categories:
- **Infrastructure Basics** — 3-Tier AWS, Azure AKS
- **Multi-Cloud & Aviatrix** — With/without Aviatrix transit, Cross-CSP, Global Transit
- **Security Products** — AWS + Security Stack, Azure + Identity, Full Security, K8s Observability
- **AI Workloads** — Unsecured AI, Protected RAG (DCF), Multi-Cloud Capacity

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | SvelteKit 5, Svelte 5 (Runes) |
| Canvas Engine | Svelte Flow |
| Visual Logic | Blockly |
| Persistence | Prisma ORM, PostgreSQL |
| Icons | Lucide-Svelte |
| Styling | Glass-morphism, CSS Variables, Dark Mode |

---

## Getting Started

### Prerequisites
- Node.js (v20+)
- npm

### Installation

```bash
# Clone & install
git clone https://github.com/Prathamesh-Nadkarni/Cloud-Orchestrator
cd Cloud-Orchestrator
npm install

# Start dev server
npm run dev
```

Open `http://localhost:5173` in your browser.

### Quick Start
1. **Drag** resources from the left sidebar onto the canvas
2. **Nest** resources inside containers (VPCs, Subnets) by dropping on them
3. **Connect** nodes by dragging from one handle to another
4. Click **Generate Manifests** to produce Terraform + K8s code and run security simulation
5. Open **Tutorial** for step-by-step guidance and sample architectures

---

## Documentation

- [**Feature Guide**](./docs/FEATURES.md) — Comprehensive reference for every feature
- [**Architecture Roadmap**](./ARCHITECTURE.md) — Current and planned architecture
- [**Operations Guide**](./OPERATIONS.md) — Deployment and operations reference

---

## License

MIT License. See [LICENSE](LICENSE) for details.
