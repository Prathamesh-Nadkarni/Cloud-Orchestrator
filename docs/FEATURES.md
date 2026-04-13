# Cloud Orchestrator — Feature Guide

A comprehensive reference for every feature in Cloud Orchestrator. Use this guide to understand the interface, build architectures, and take advantage of the security intelligence engine.

---

## Table of Contents

1. [Canvas & Workspace](#1-canvas--workspace)
2. [Resource Sidebar](#2-resource-sidebar)
3. [Drag & Drop with Smart Highlighting](#3-drag--drop-with-smart-highlighting)
4. [Hierarchical Nesting](#4-hierarchical-nesting)
5. [Network Connections](#5-network-connections)
6. [Property Drawer](#6-property-drawer)
7. [Security Products & Vendor Integrations](#7-security-products--vendor-integrations)
8. [Intelligent Product Suggestions](#8-intelligent-product-suggestions)
9. [Distributed Cloud Firewall (DCF)](#9-distributed-cloud-firewall-dcf)
10. [Security Simulation Engine](#10-security-simulation-engine)
11. [Code Generation](#11-code-generation)
12. [Import & Export](#12-import--export)
13. [Persistence & Versioning](#13-persistence--versioning)
14. [Deployment Lifecycle](#14-deployment-lifecycle)
15. [Vendor Marketplace](#15-vendor-marketplace)
16. [Governance & Admin Review](#16-governance--admin-review)
17. [3D Isometric View](#17-3d-isometric-view)
18. [Tutorial & Sample Architectures](#18-tutorial--sample-architectures)
19. [Cost Estimation](#19-cost-estimation)
20. [Keyboard Shortcuts](#20-keyboard-shortcuts)

---

## 1. Canvas & Workspace

The central workspace is powered by **Svelte Flow**, a high-performance node-based canvas engine.

**Key capabilities:**
- Pan the canvas by clicking and dragging on empty space
- Zoom in/out with the scroll wheel or the controls in the bottom-left
- Use the **minimap** (bottom-right) for quick navigation on large architectures
- Multi-select nodes by holding `Shift` and clicking, or by drawing a selection box
- Right-click any node to open the **context menu** with quick actions

---

## 2. Resource Sidebar

The left sidebar contains all available infrastructure blocks, organized by cloud provider:

| Provider | Resources |
|----------|-----------|
| **AWS** | VPC, Subnet, Security Group, EC2, EKS, S3, EBS |
| **Azure** | VNet, Subnet, NSG, Azure VM, AKS, Blob Storage, Managed Disk |
| **Google Cloud** | VPC Network, Subnetwork, Firewall Rule, Compute Engine, GKE, Cloud Storage, Persistent Disk |
| **Kubernetes** | K8s Node, K8s Pod, K8s Service |
| **Aviatrix** | Transit Gateway, Spoke Gateway, FireNet, DCF Policy |
| **External** | Internet (0.0.0.0/0), On-Premise Datacenter |
| **AI Workloads** | Model Serving, Vector DB, Training Cluster, AI Gateway, Model Registry, External Model API |

**Usage:**
1. Use the **search box** to quickly filter resources by name
2. **Drag** any block from the sidebar onto the canvas
3. Hover over a block to see a drag grip icon — grab and drop onto the canvas or onto a container node

---

## 3. Drag & Drop with Smart Highlighting

When you drag a resource from the sidebar, the system **highlights valid drop targets** in real time:

- **Container nodes** (VPCs, VNets, Subnets, K8s Clusters) glow with a cyan pulsing border and a "Drop here" label if the dragged resource can be nested inside them
- **The canvas background** shows a subtle green outline when the resource can be placed at the root level
- Vendor security products respect their **hierarchy metadata** — products marked `inside_vpc` will only highlight VPC/VNet containers, while `external` products highlight the canvas itself

This prevents placement errors before they happen.

---

## 4. Hierarchical Nesting

Cloud Orchestrator enforces correct cloud architecture hierarchy:

```
Region
└── VPC / VNet
    └── Subnet
        └── Security Group / NSG
            └── Compute / Database / Storage
    └── Kubernetes Cluster
        └── K8s Node
            └── K8s Pod / K8s Service
```

**Rules enforced automatically:**
- Resources must match their parent's cloud provider (no AWS resources inside Azure VNets)
- Kubernetes clusters can nest inside VPCs
- K8s Pods and Services must be inside K8s Nodes
- Aviatrix gateways connect across providers but sit at the root level
- When you drag a node onto a container, a **confirmation dialog** appears before nesting

---

## 5. Network Connections

Create connections between nodes to represent network flows:

1. Hover over a node to see its **connection handles** (small circles on each side)
2. Drag from one handle to another to create a connection edge
3. Click any edge to configure:
   - **Protocol** (TCP, UDP, HTTPS, ALL)
   - **Port** number or `*` for all ports
   - **Bandwidth** and **traffic pattern** metadata

**Cross-Cloud Rules:**
- Direct connections between different cloud providers are **blocked by default**
- To connect AWS ↔ Azure ↔ GCP, you must route through an **Aviatrix Transit Gateway**
- An alert will explain why a cross-cloud connection was blocked

---

## 6. Property Drawer

Click any node or edge to open the **Property Drawer** on the right side:

**For Nodes:**
- Edit label, CIDR block, instance size, disk allocation
- View provider and resource type
- Configure DCF-specific rules when DCF mode is enabled

**For Edges:**
- Set protocol and port
- Configure expected bandwidth (Mbps) for capacity analysis
- Set traffic pattern (steady, bursty) for simulation accuracy

---

## 7. Security Products & Vendor Integrations

Cloud Orchestrator supports **10 enterprise security vendors** that can be added to your architecture:

| Vendor | Product | Placement | Description |
|--------|---------|-----------|-------------|
| Palo Alto | Prisma Cloud | External | CSPM: scans entire cloud accounts from outside |
| CrowdStrike | Falcon | Inside VPC | EDR agent deployed inside VPCs for runtime protection |
| Okta | Identity (SSO/MFA) | External | Identity provider connecting to all services externally |
| HashiCorp | Vault | Inside VPC | Secrets management deployed inside VPCs |
| Cloudflare | Cloudflare One (ZTNA) | Inside VPC | Zero-trust access connecting to services inside VPCs |
| Zscaler | ZIA/ZPA | Inside VPC | Secure web gateway inside VPCs |
| Wiz | Cloud Security | External | Agentless cloud vulnerability scanner |
| Datadog | Monitoring | Inside VPC | Observability agent deployed inside VPCs |
| Rubrik | Backup & Recovery | External | Backup and disaster recovery from outside |
| Microsoft | Defender for Cloud | Inside VPC | CWPP agent inside VPCs |

**Placement hierarchy is enforced:**
- `external` products sit at the root canvas level (not inside any VPC)
- `inside_vpc` products must be dropped inside a VPC, VNet, Subnet, or K8s Cluster
- Drag-drop highlighting shows valid placement zones for each product

---

## 8. Intelligent Product Suggestions

Click **Suggestions** in the top navigation to open the AI-powered recommendation panel.

The suggestion engine analyzes your current architecture and identifies security gaps:

- **Critical**: Your architecture has compute resources without endpoint protection
- **High Priority**: No secrets management for services handling credentials
- **Recommended**: Missing monitoring/observability for production workloads
- **Optional**: Backup and recovery not configured

**Each suggestion shows:**
- Why the product is recommended
- Which resources are affected
- Integration type (external or inside VPC)
- Auto-configuration preview

Click **Apply Suggestion** to automatically add the security product to your architecture with correct placement and hierarchy.

---

## 9. Distributed Cloud Firewall (DCF)

The DCF system brings **Aviatrix Distributed Cloud Firewall** rules into your architecture design.

**Access via the Security button in the top nav:**

1. **Toggle DCF Mode** — Enables/disables DCF enforcement in simulations
2. **Upload Policies** — Import a JSON file containing DCF rules
3. **Advanced Console** — Opens the full firewall manager with rule editor

**DCF Policy Format (JSON):**
```json
{
  "policies": [
    {
      "name": "Block internet to database",
      "source": "internet",
      "destination": "database",
      "action": "DENY",
      "protocol": "ALL",
      "port": "*",
      "priority": 100
    }
  ]
}
```

When DCF mode is active, the simulation engine evaluates all traffic flows against your DCF rules and blocks violating connections.

---

## 10. Security Simulation Engine

Click **Generate Manifests** to run the full data-flow simulation:

The simulator performs a **graph-based audit** of your architecture:

1. **Traces every network path** through your node/edge graph
2. **Evaluates 15+ security rules** including:
   - Unencrypted database connections
   - Direct internet access to sensitive services
   - Exposed administrative ports (SSH, RDP)
   - Missing encryption in transit
   - AI workload isolation violations
3. **Applies DCF policies** to determine blocked traffic
4. **Color-codes edges** on the canvas:
   - 🟢 **Green** = Secure, validated flow
   - 🔴 **Red** = Vulnerable flow (hover for details)
   - 🟠 **Orange (dashed)** = Blocked by DCF policy

The **Simulation Report** tab shows:
- High/Medium/Low risk counts
- AI-specific risk assessment
- Capacity bottleneck detection
- DCF blocked flow count
- Detailed vulnerability cards with remediation guidance

---

## 11. Code Generation

After simulation, Cloud Orchestrator generates production-ready infrastructure code:

**Terraform (main.tf):**
- Provider blocks for all cloud providers used
- VPC/VNet resources with CIDR blocks
- Subnet definitions with associations
- Security group rules derived from your edge configurations
- Compute instances with sizing
- Database and storage resources

**Kubernetes (k8s.yaml):**
- Namespace definitions
- Deployment manifests
- Service definitions
- Network Policies derived from your connections

**Built-in Editor:**
- Syntax-highlighted dark-themed code editor
- Edit generated code directly
- **Sync to Canvas** — parse manual Terraform edits back to the visual diagram
- Copy to clipboard or download as file

---

## 12. Import & Export

The top navigation provides multiple import/export options:

| Action | Format | Description |
|--------|--------|-------------|
| Export JSON | `.json` | Save your full architecture (nodes + edges) as JSON |
| Import JSON | `.json` | Load a previously exported architecture file |
| Import .tf | `.tf` | Parse a Terraform file and auto-generate canvas nodes |
| Import DCF | `.json` | Load external DCF policy rules |
| Export PNG | `.png` | Export the canvas as an image |

---

## 13. Persistence & Versioning

**Save & Load:**
- Click **Save** to persist your diagram to the cloud database (Prisma/PostgreSQL)
- Click **Load** to browse and restore previously saved diagrams
- The **sync status indicator** shows whether your local changes are saved:
  - 🟢 **Synced** — All changes saved
  - 🟡 **Diverged** — Local changes not yet saved
  - ⚪ **Draft** — New diagram, never saved

**Version History:**
- Click **History** to browse immutable snapshots of your diagram
- Restore any previous version with one click
- Each save creates a new version entry

---

## 14. Deployment Lifecycle

Click **Lifecycle** to manage infrastructure deployments:

- **Plan** — Preview infrastructure changes before applying
- **Apply** — Execute the deployment to your cloud environment
- **Destroy** — Tear down deployed infrastructure

Requires a saved diagram and active cloud connection.

---

## 15. Vendor Marketplace

Click **Market** to browse the vendor marketplace:

- Discover security and infrastructure integrations
- Install vendor products directly into your architecture
- View integration requirements and compatibility
- Products include marketplace badges on the canvas

---

## 16. Governance & Admin Review

Click **Govern** to access governance controls:

- **Approval workflows** — Require admin sign-off before deployment
- **Audit logs** — Append-only record of all infrastructure changes
- **Policy violations** — Review and resolve blocked operations
- **MFA escalation** — Security-sensitive operations require step-up authentication

---

## 17. 3D Isometric View

Toggle the **3D** button to switch to a Cloudcraft-style isometric perspective:

- Nodes render with volumetric extrusion (3D block shapes)
- Container nodes appear as elevated platforms
- Network edges render with depth
- Camera-aware scaling for consistent visual weight
- Toggle back to **2D** for flat editing

---

## 18. Tutorial & Sample Architectures

Click **Tutorial** to open the getting-started overlay:

**Guide Tab:**
Step-by-step instructions for drag-and-drop, nesting, connections, code generation, and import/export.

**Samples Tab:**
Pre-built architectures organized into 4 categories:

| Category | Samples |
|----------|---------|
| **Infrastructure Basics** | 3-Tier AWS Web App, Azure AKS Cluster |
| **Multi-Cloud & Aviatrix** | Without Aviatrix (blocked), With Aviatrix (secured), Cross-CSP, Global Transit |
| **Security Products** | AWS + Security Stack, Azure + Identity & Secrets, Full Security Stack, K8s Observability |
| **AI Workloads** | Unsecured AI Gateway, Protected AI (DCF), Multi-Cloud Capacity |

**Pinpoint UI Mode:**
Click "Pinpoint UI" to see animated annotations pointing to key interface elements on the actual canvas.

---

## 19. Cost Estimation

The top navigation displays a real-time **estimated monthly cost** badge:

- Costs are calculated from compute instance sizes, K8s cluster configurations, and disk allocations
- Click the badge to open the **Cost Breakdown** panel with per-resource details
- Costs update automatically as you add/remove/resize resources

---

## 20. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Esc` | Close any open modal or code viewer |
| `Shift + Click` | Multi-select nodes |
| `Scroll` | Zoom in/out on canvas |
| `Right-click` | Open node context menu |
| `Drag` from handle | Create a network connection |

---

## Architecture & Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | SvelteKit 5, Svelte 5 (Runes) |
| Canvas | Svelte Flow |
| Visual Logic | Blockly |
| Persistence | Prisma ORM, PostgreSQL |
| Icons | Lucide-Svelte |
| Styling | Glass-morphism, CSS Variables, Dark Mode |
