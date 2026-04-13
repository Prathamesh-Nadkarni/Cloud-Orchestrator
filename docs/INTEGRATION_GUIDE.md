# Security & Infrastructure Integration Guide

This guide explains how to integrate enterprise security and infrastructure products into your Cloud Orchestrator diagrams.

## Available Integrations

### Cloud Security (CNAPP)

#### Prisma Cloud by Palo Alto Networks
**Category:** CNAPP / Cloud Security  
**Integration Mode:** API Connector  
**Best First Integration:** API connector + findings ingest + attack-path/risk overlay + vendor node

**Setup Requirements:**
- ✅ API credentials (API Key + Secret)
- ✅ Cloud account access (AWS, Azure, GCP)
- ✅ Network connectivity
- ✅ Read/scan permissions

**Integration Steps:**
1. Create Prisma Cloud account at [Prisma Cloud Console](https://app.prismacloud.io)
2. Generate API credentials from Settings → Access Keys
3. Add cloud accounts to Prisma Cloud
4. Drag "Prisma Cloud" node from Security sidebar to your diagram
5. Configure API connection block with your credentials
6. Link to protected resources in your infrastructure

**What You'll See:**
- Real-time security posture overlay on your resources
- Attack path visualization between components
- Risk scores and findings mapped to infrastructure
- Compliance status indicators

---

#### Wiz
**Category:** CNAPP / Cloud Security  
**Integration Mode:** API Connector + Security Graph  
**Best First Integration:** API connector + security graph overlay + "connect and scan" experience

**Setup Requirements:**
- ✅ API credentials
- ✅ Cloud account access (AWS, Azure, GCP)
- ✅ Network connectivity
- ✅ Scan permissions

**Integration Steps:**
1. Sign up for Wiz account
2. Connect cloud accounts via Wiz connector
3. Initiate initial security scan
4. Add Wiz vendor node to diagram
5. View security graph overlay
6. Review attack path findings

**What You'll See:**
- Agentless security graph visualization
- Attack path analysis from internet to sensitive data
- Vulnerability and misconfiguration detection
- Resource relationships and dependencies

---

#### Microsoft Defender for Cloud
**Category:** CNAPP / Cloud Security  
**Integration Mode:** Native Azure Integration  
**Best First Integration:** Azure-first connector + findings/recommendations ingest + policy mapping

**Setup Requirements:**
- ✅ Azure subscription
- ✅ Cloud account access (Azure, AWS, GCP)
- ⚠️ Agent deployment required for workload protection
- ✅ Network connectivity

**Integration Steps:**
1. Enable Defender for Cloud in Azure Portal
2. Connect AWS/GCP accounts through multi-cloud connectors
3. Deploy agents to workloads (VMs, containers)
4. Add Defender node to diagram
5. Ingest recommendations and findings
6. Map security policies to infrastructure

**What You'll See:**
- Security recommendations overlaid on resources
- Compliance score and posture
- Just-in-time VM access indicators
- Workload protection status

---

### Endpoint Security

#### CrowdStrike Falcon
**Category:** Endpoint Protection / EDR  
**Integration Mode:** Agent Deployment Pattern  
**Best First Integration:** Agent deployment pattern + protected-node overlay + detection telemetry mapping

**Setup Requirements:**
- ✅ API credentials
- ✅ Compute instance access
- ⚠️ Agent deployment required
- ✅ Network connectivity

**Integration Steps:**
1. Create CrowdStrike account
2. Generate API credentials
3. Deploy Falcon agent to compute instances (EC2, VMs, etc.)
4. Add CrowdStrike vendor node to diagram
5. Configure agent deployment pattern
6. Map protected endpoints

**What You'll See:**
- Protected endpoint indicators on compute resources
- Real-time threat detection status
- EDR coverage visualization
- Agent deployment status per resource

---

### Identity & Access Management

#### Okta Workforce Identity
**Category:** Identity / SSO / MFA  
**Integration Mode:** Identity Plugin  
**Best First Integration:** Identity node/plugin + SSO/MFA policy modeling + app-access flow simulation

**Setup Requirements:**
- ✅ API credentials
- ✅ Domain verification
- ✅ Network connectivity
- ❌ No agent deployment needed

**Integration Steps:**
1. Create Okta developer account
2. Configure SSO applications
3. Set up MFA policies
4. Add Okta identity node to diagram
5. Model SSO/MFA policy flows
6. Simulate app-access flows

**What You'll See:**
- Identity federation paths
- SSO/MFA enforcement points
- User access flows to cloud resources
- Authentication policy visualization

---

### SASE / Zero Trust

#### Cloudflare One
**Category:** SASE / Zero Trust  
**Integration Mode:** Edge Security Node  
**Best First Integration:** Edge/security node + access path modeling + product trial CTA

**Setup Requirements:**
- ✅ API credentials
- ✅ DNS configuration
- ✅ Network connectivity
- ❌ No agent deployment needed

**Integration Steps:**
1. Sign up for Cloudflare account
2. Configure Zero Trust dashboard
3. Set up access policies
4. Add Cloudflare edge node to diagram
5. Model access paths through edge
6. Enable product trial

**What You'll See:**
- Zero Trust access paths
- Edge security enforcement points
- ZTNA gateway connections
- Secure Web Gateway flows

---

#### Zscaler Zero Trust Exchange
**Category:** SASE / Zero Trust  
**Integration Mode:** Zero-Trust Edge Node  
**Best First Integration:** Zero-trust edge node + path-hardening simulation + contact/eval link

**Setup Requirements:**
- ✅ API credentials
- ⚠️ Connector deployment required
- ⚠️ Agent deployment for user endpoints
- ✅ Network connectivity

**Integration Steps:**
1. Request Zscaler demo/trial
2. Deploy app connectors in cloud
3. Configure access policies
4. Add Zscaler zero-trust edge node
5. Simulate path hardening
6. Contact for evaluation

**What You'll See:**
- Zero trust network architecture
- App connector locations
- Hardened access paths
- Security policy enforcement zones

---

### Observability & Monitoring

#### Datadog Infrastructure Monitoring
**Category:** Observability  
**Integration Mode:** Agent/Telemetry  
**Best First Integration:** Agent/chart/module injection + telemetry coverage overlay

**Setup Requirements:**
- ✅ API credentials
- ✅ Cloud account access (AWS, Azure, GCP)
- ⚠️ Agent deployment required
- ✅ Metrics endpoint access
- ✅ Network connectivity

**Integration Steps:**
1. Create Datadog account
2. Generate API key and App key
3. Deploy Datadog agent to resources
4. Add Datadog monitoring node to diagram
5. Inject agent/chart modules
6. View telemetry coverage overlay

**What You'll See:**
- Telemetry coverage heatmap
- Monitored vs unmonitored resources
- APM trace path visualization
- Log aggregation flows

---

### Cyber Resilience / Backup

#### Rubrik Security Cloud
**Category:** Backup / Disaster Recovery  
**Integration Mode:** Backup/Recovery Node  
**Best First Integration:** Backup/recovery node + protection-policy simulation + recovery metadata

**Setup Requirements:**
- ✅ API credentials
- ✅ Cloud account access (AWS, Azure, GCP)
- ✅ Storage access permissions
- ✅ Snapshot permissions
- ✅ Network connectivity

**Integration Steps:**
1. Sign up for Rubrik Security Cloud
2. Connect cloud accounts
3. Configure backup policies
4. Add Rubrik backup/recovery node
5. Simulate protection policies
6. View recovery metadata

**What You'll See:**
- Backup protection coverage
- Recovery point objectives (RPO) visualization
- Immutable snapshot indicators
- Cyber resilience score per resource

---

### Secrets Management

#### HashiCorp Vault
**Category:** Secrets / Encryption  
**Integration Mode:** Secret Plane Integration  
**Best First Integration:** Native secret-plane integration + plugin + dynamic-cred workflow

**Setup Requirements:**
- ✅ Vault address (self-hosted or HCP)
- ✅ Vault token
- ✅ Network connectivity
- ❌ No agent deployment needed

**Integration Steps:**
1. Deploy Vault server or use HCP Vault
2. Initialize and unseal Vault
3. Configure secret engines (AWS, Azure, GCP)
4. Add Vault secret-plane node to diagram
5. Integrate with infrastructure resources
6. Enable dynamic-credential workflow

**What You'll See:**
- Secret injection paths to resources
- Dynamic credential generation flows
- Encryption-as-a-service connections
- Secret lifecycle visualization

---

## Node Types and Visual Indicators

### Vendor Integration Node Properties

Each vendor integration node displays:

1. **Integration Status Bar** - Visual progress indicator (0-100%)
   - 🔴 Red (0-30%): Missing critical requirements
   - 🟡 Yellow (31-99%): Partial configuration
   - 🟢 Green (100%): Fully configured and operational

2. **Requirements Checklist**
   - ✅ Green checkmarks: Requirements met
   - ⚠️ Yellow alerts: Requirements pending
   - Expandable list showing all setup needs

3. **Integration Mode Badge**
   - API Connector
   - Agent Deployment
   - Identity Plugin
   - Edge Security
   - Secret Plane
   - Backup/Recovery

4. **Quick Actions**
   - Setup Guide link
   - Documentation access
   - Configuration panel

### Canvas Visualization

When integrated products are added:

- **Overlay Effects**: Security findings, attack paths, and risk scores appear on affected resources
- **Connection Lines**: Show data flows, protection boundaries, and policy enforcement
- **Color Coding**: 
  - 🟢 Green: Protected/compliant
  - 🟡 Yellow: Partially protected/warnings
  - 🔴 Red: Vulnerable/violations
  - 🔵 Blue: Informational/monitoring

---

## Best Practices

### 1. Start with CNAPP Platforms
Begin with Prisma Cloud, Wiz, or Defender for Cloud to get comprehensive visibility across your cloud estate.

### 2. Layer Zero Trust Networking
Add Cloudflare One or Zscaler to enforce zero-trust access policies at the network edge.

### 3. Add Endpoint Protection
Deploy CrowdStrike Falcon agents to all compute resources for workload protection.

### 4. Implement Identity Integration
Connect Okta to visualize authentication and authorization flows.

### 5. Enable Observability
Add Datadog to monitor infrastructure health and performance alongside security.

### 6. Secure Secrets
Integrate Vault to manage credentials and eliminate hardcoded secrets.

### 7. Plan for Resilience
Add Rubrik to ensure backup and recovery capabilities for critical data.

---

## Troubleshooting

### Node Shows Low Integration Status

**Problem**: Integration node shows 0-30% configured  
**Solution**:
1. Click the node to open property drawer
2. Review requirements checklist
3. Add missing API credentials in configuration
4. Verify cloud account connections
5. Check network connectivity

### Missing Overlay Effects

**Problem**: Security findings not appearing on resources  
**Solution**:
1. Ensure API connection is configured
2. Verify scan has completed in vendor console
3. Check that resources are linked to protection
4. Refresh diagram data

### Agent Deployment Issues

**Problem**: CrowdStrike or Datadog agents not deploying  
**Solution**:
1. Verify compute resource access
2. Check agent deployment terraform modules
3. Review network security groups for outbound access
4. Confirm agent registration with vendor console

---

## Support Resources

- [Cloud Orchestrator Documentation](/docs)
- [Security Integration Forum](https://community.cloudorchestrator.io/integrations)
- [Video Tutorials](https://www.youtube.com/cloudorchestrator)
- [Integration Templates](https://github.com/cloudorchestrator/integration-templates)

For vendor-specific support, refer to each product's documentation link in their integration section above.
