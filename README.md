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
- **Smart Edge Routing & Styling**: Connect resources with directional arrows that dynamically adapt to show the connection type. Protocols (TCP, UDP, HTTP, HTTPS) trigger specific color accents, dashed styles, and inline native labels (e.g., `TCP : 443`).
- **Multi-Cloud Governance Rules**: The system organically enforces architectural logic—preventing direct cross-CSP links without an Aviatrix Transit Gateway and safeguarding Kubernetes scopes.
- **Advanced Canvas Scaling**: Analyze massive enterprise networks with deep dynamic zoom capabilities spanning structurally out to `0.05x` scale, or tight inwards to `16.0x`.
- **Terraform Converter View**: Switch to a custom dark-themed Blockly workspace to visually construct, read, or manage raw Terraform logic via visual interlocking structures.
- **Dual Code Generation**:
  - Automatically writes `main.tf` Terraform code, including dynamically calculated Security Groups and Firewall rules mapped from visual edges.
  - Automatically writes `k8s.yaml` manifest code, converting graphical clusters and nodes into Deployments, Services, and strictly-governed `NetworkPolicy` restrictions.
- **Local Browser State Management**: Save your architectural layout to `localStorage`, or export/import the blueprint as a `.json` configuration file. Try importing one of the complex cross-CSP samples!
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

## Technologies Used

* **[SvelteKit](https://kit.svelte.dev/)**: Frontend application framework and static page generation.
* **[Svelte Flow](https://svelteflow.dev/)**: Node-based UI toolkit powering the interactive map layers and directional edge pipelines.
* **Vanilla CSS**: Custom styling, theme tokens, and dynamic `.container-node` sizing with translucent glassmorphism aesthetics.
* **Lucide-Svelte**: Comprehensive UI icon set representing provider infrastructures.
