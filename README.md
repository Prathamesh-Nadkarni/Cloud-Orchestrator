# Cloud Infrastructure Designer

A powerful, visual drag-and-drop tool to design Multi-Cloud Architectures and automatically generate production-ready Infrastructure as Code (Terraform) and Kubernetes Manifests.

[Demo](https://prathamesh-nadkarni.github.io/Cloud-Orchestrator/)

## Overview

Cloud Infrastructure Designer breaks the barrier between architectural diagrams and deployable code. Built on SvelteKit and Svelte Flow, it provides a highly interactive workspace where you can visually organize AWS, Azure, GCP, Kubernetes, and Aviatrix resources.

Instead of writing hundreds of lines of Terraform, you simply:
1. Drag and drop resources onto the canvas.
2. Group resources into logical network boundaries (VPCs, Subnets, Security Groups).
3. Connect resources together with explicit network rules (Protocol / Port).
4. Click **Generate** to receive instant multi-file code outputs representing your diagram.

## Features

- **Multi-Cloud Support**: Drag and drop resources across AWS, Azure, Google Cloud, and localized Kubernetes environments, along with external entities like On-Premise Datacenters and the Public Internet.
- **Hierarchical Nesting**: Visually nest resources (e.g., place a Subnet inside a VNet, and an AKS Cluster inside that Subnet). The layout correctly maps these parent-child relationships for deployments.
- **Security Simulation & Vulnerability Detection**: A comprehensive security engine that analyzes your network graph against 15+ critical security rules. It identifies:
  - Unencrypted data flows (HTTP/FTP/Telnet).
  - Direct Public Internet access to sensitive resources (Databases, K8s).
  - Exposed administrative ports (SSH/RDP) to the internet.
  - Cross-cloud communication isolation issues.
  - Subnet/VPC isolation violations for compute and storage nodes.
- **3D Isometric View**: Toggle a Cloudcraft-style isometric 3D perspective with volumetric node extrusions. This view features a mathematically-perfect scale (2.4x) to ensure the tilted plane fills the entire viewport without corner gaps, while maintaining zoom similarity with 2D mode.
- **Hover-based Vulnerability Labels**: For a clean workspace, security warnings appear only when you hover over affected network lines (edges). Interactive tooltips show specific risks like "⚠ Unencrypted Data Flow" or "🛡 Blocked by DCF Policy".
- **Real-time Security Metrics**: The top navigation bar displays a live count of High-Risk, Medium-Risk, and DCF-Blocked flows detected in the current simulation.
- **Advanced Canvas Scaling**: Zoom capabilities from `0.05x` to `16.0x` with viewport-aware drag-and-drop positioning.
- **Terraform Converter View**: Switch to a custom dark-themed Blockly workspace to visually construct, read, or manage raw Terraform logic via visual interlocking structures.
- **Terraform File Import (.tf)**: Import your own `.tf` Terraform files directly. The parser extracts `resource` blocks and automatically creates canvas nodes with the correct provider, type, CIDR, and instance sizing.
- **Dual Code Generation**:
  - Automatically writes `main.tf` Terraform code, including dynamically calculated Security Groups and Firewall rules mapped from visual edges.
  - Automatically writes `k8s.yaml` manifest code, converting graphical clusters and nodes into Deployments, Services, and strictly-governed `NetworkPolicy` restrictions.
- **Interactive Tutorial & Sample Loader**: Click the **Tutorial** button in the top nav to access a detailed 5-step getting started guide. Switch to the **Load Sample** tab to instantly load pre-built architectures including:
  - 3-Tier AWS Web App
  - Azure AKS Cluster
  - Cross-CSP with Aviatrix
  - Global Multi-Cloud Transit
- **Local Browser State Management**: Save your architectural layout to `localStorage`, or export/import the blueprint as a `.json` configuration file.
- **Image Export & Cost Estimation**: Capture your architecture visually as a PNG via the top navigation bar, and view rough projected monthly runtime costs based on active instances.

## How to Run

### Prerequisites
- Node.js (v18+)
- npm

### Installation

1. Install all dependencies:
   ```bash
   npm install
   ```

2. Start the local development server:
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```

## Canvas Capabilities & Shortcuts

- **Nodes**: Click to select. Properties can be changed via the right-side slide-out drawer.
- **Edges**: Click and drag from any component handle to another. Click an edge to configure protocols and ports.
- **Grouping Rules**:
  - **AWS/Azure/GCP Compute** must be placed in generic networks (VPC/VNet -> Subnets) or Security Groups.
  - **Kubernetes Nodes** must be placed inside a Kubernetes cluster block.
  - **Kubernetes Pods/Services** must be placed inside K8s Nodes/Clusters.
  - The SvelteFlow canvas enforces drag restrictions organically. Dragging objects outside of valid scopes will snap them back safely.
- **Keyboard Shortcuts**:
  - `Cmd + Z` / `Ctrl + Z`: Undo last node placement
  - `Cmd + D` / `Ctrl + D`: Duplicate currently selected node
  - `Backspace` / `Delete`: Delete currently selected node or edge

## Sample Architectures

The `samples/` directory contains ready-to-load JSON blueprints. You can also access these directly from the **Tutorial → Load Sample** tab inside the app:

| Sample | Description |
|--------|-------------|
| `multi-tier-aws.json` | Classic 3-tier web architecture with VPC, public/app/db subnets, and RDS replicas |
| `azure-kubernetes.json` | Azure AKS cluster inside a VNet with SQL Server backend |
| `cross-csp-example.json` | AWS VPC ↔ Aviatrix Transit ↔ Azure VNet multi-cloud backbone |
| `aviatrix-multi-cloud.json` | Three CSPs (AWS, Azure, GCP) connected via Aviatrix with on-prem datacenter |
| `security-audit-sample.json` | A scenario pre-populated with common vulnerabilities (open ports, unencrypted flows) for testing the simulation engine |

## Security Ruleset

The simulation engine automatically checks for the following vulnerabilities:

1. **Unencrypted HTTP**: High Risk - Cleartext web traffic (Port 80).
2. **Insecure FTP**: High Risk - Unencrypted file transfers (Port 21).
3. **Exposed Telnet**: High Risk - Unencrypted remote access (Port 23).
4. **Internet to DB**: High Risk - Direct public access to database nodes.
5. **Internet to Storage**: High Risk - Direct public access to storage blobs/buckets.
6. **Exposed SSH**: Medium Risk - Administrative port open to the Public Internet.
7. **Exposed RDP**: Medium Risk - Remote Desktop port open to the Public Internet.
8. **Admin Port to App**: Medium Risk - Administrative ports (SSH/RDP) allowed to application nodes.
9. **Direct Cross-Cloud**: High Risk - Clouds connected without Transit/VPN infrastructure.
10. **Unencrypted Cross-Cloud**: High Risk - Non-HTTPS/SSH traffic between two different CSPs.
11. **Storage Isolation**: Medium Risk - Storage nodes not contained within a private subnet.
12. **Database Isolation**: Medium Risk - Database nodes not contained within a private subnet.
13. **Compute Isolation**: Low Risk - Compute nodes sitting directly in a VPC without a private subnet.
14. **Internet Gateway Misconfig**: Medium Risk - Private VPCs with a direct Internet Gateway attachment.
15. **DCF Policy Violation**: Blocked - Traffic explicitly blocked by a Distributed Cloud Firewall rule.

## Technologies Used

* **[SvelteKit](https://kit.svelte.dev/)**: Frontend application framework and static page generation.
* **[Svelte Flow](https://svelteflow.dev/)**: Node-based UI toolkit powering the interactive map layers and directional edge pipelines.
* **Vanilla CSS**: Custom styling, theme tokens, and dynamic `.container-node` sizing with translucent glassmorphism aesthetics.
* **Lucide-Svelte**: Comprehensive UI icon set representing provider infrastructures.

