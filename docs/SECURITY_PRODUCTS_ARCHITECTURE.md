# Security Products: Architecture & Rules

This document explains each security product's purpose, how it connects to your cloud architecture, and the security rules enforced by the platform.

---

## Table of Contents

1. [CNAPP / Cloud Security](#cnapp--cloud-security)
   - [Prisma Cloud](#1-prisma-cloud-palo-alto-networks)
   - [Wiz](#2-wiz)
   - [Microsoft Defender for Cloud](#3-microsoft-defender-for-cloud)
2. [Endpoint Security](#endpoint-security)
   - [CrowdStrike Falcon](#4-crowdstrike-falcon-endpoint-security)
3. [Identity & Access Management](#identity--access-management)
   - [Okta](#5-okta-workforce-identity)
4. [SASE / Zero Trust](#sase--zero-trust)
   - [Cloudflare One](#6-cloudflare-one)
   - [Zscaler](#7-zscaler-zero-trust-exchange)
5. [Observability](#observability)
   - [Datadog](#8-datadog-infrastructure-monitoring)
6. [Cyber Resilience](#cyber-resilience)
   - [Rubrik](#9-rubrik-security-cloud)
7. [Secrets Management](#secrets-management)
   - [HashiCorp Vault](#10-hashicorp-vault)

---

## CNAPP / Cloud Security

### 1. Prisma Cloud (Palo Alto Networks)

**What It Does:**
Prisma Cloud provides comprehensive cloud security from code to runtime across your entire cloud estate. It combines CSPM (Cloud Security Posture Management), CWPP (Cloud Workload Protection Platform), CNSPM (Cloud Network Security Posture Management), and WAAS (Web Application and API Security).

**How It Connects to Architecture:**

```
Architecture Layer: External Security Layer (API-based observation)
Connection Type: API Observer (Agentless + Optional Agents)
Scan Method: Agentless API scanning + CloudTrail/Audit Logs

Connection Pattern:
┌─────────────────┐
│ Prisma Cloud    │ ◄──── Read-only API ────┐
│ (SaaS Platform) │                          │
└────────┬────────┘                          │
         │                                    │
         ├──── HTTPS (443) ─────►  ┌─────────┴─────────┐
         │                         │  Cloud Accounts   │
         │                         │  (AWS/Azure/GCP)  │
         │                         └───────────────────┘
         │                                    │
         ├──── Findings/Alerts ──►  ┌────────┴──────────┐
         │                          │ Protected Resources│
         │                          │ (VPC, EC2, S3, etc)│
         └──────────────────────────┴───────────────────┘

Data Flows:
• Cloud APIs → Prisma Cloud: Configuration metadata (HTTPS:443)
• Audit Logs → Prisma Cloud: Activity logs (HTTPS:443)
• Prisma Cloud → Protected Resources: Scan results & findings
```

**What It Protects:**
- ✅ Compute (EC2, VMs, Containers)
- ✅ Storage (S3, Blob, Cloud Storage)
- ✅ Network (VPCs, Subnets, Security Groups)
- ✅ Kubernetes (EKS, AKS, GKE)
- ✅ Databases (RDS, SQL Database, Cloud SQL)
- ✅ Serverless Functions

**Security Rules Enforced:**

| Rule ID | Severity | Requirement | Enforcement |
|---------|----------|-------------|-------------|
| PR-001 | 🔴 Critical | API credentials must be in Vault/Secrets Manager | Blocks hardcoded credentials |
| PR-002 | 🔴 High | Must scan all cloud accounts in diagram | Validates full coverage |
| PR-003 | 🟡 Medium | Auto-remediation only in non-prod | Prevents prod disruption |
| PR-004 | 🔵 Low | Compliance frameworks configured | Recommends governance |

**Required Permissions:**
- **AWS:** `ReadOnlyAccess`, `SecurityAudit`
- **Azure:** `Reader`, `Security Reader`
- **GCP:** `Viewer`, `Security Reviewer`

**Visual Indicators in Platform:**
When Prisma Cloud is integrated, your diagram shows:
- 🟢 Green overlay: Resources with healthy security posture
- 🟡 Yellow overlay: Resources with medium-risk findings
- 🔴 Red overlay: Resources with critical vulnerabilities
- 📊 Attack path visualization from internet to sensitive data
- 🎯 Risk scores per resource

---

### 2. Wiz

**What It Does:**
Wiz provides agentless cloud security with deep visibility through snapshot analysis. It builds a comprehensive security graph showing relationships between all cloud resources and identifies attack paths from external access points to your crown jewels (databases, secrets).

**How It Connects to Architecture:**

```
Architecture Layer: External Security Layer (Snapshot-based)
Connection Type: Agentless Scanner
Scan Method: Disk snapshot analysis + API metadata

Connection Pattern:
┌─────────────┐
│  Wiz Cloud  │ ◄──── API Connector ────┐
│  Platform   │                          │
└──────┬──────┘                          │
       │                                 │
       ├──── Snapshot Analysis ──► ┌────┴──────────┐
       │                           │ Cloud Accounts│
       │                           │ (AWS/Azure/GCP│
       │                           └───────────────┘
       │                                   │
       ├──── Security Graph ──────► ┌─────┴─────────────┐
       │                            │  Resources         │
       │                            │  • Disk Snapshots  │
       └────────────────────────────│  • Metadata        │
                                    │  • Relationships   │
                                    └────────────────────┘

Data Flows:
• Wiz → Cloud: Snapshot requests (HTTPS:443)
• Disk Snapshots → Wiz: Filesystem data (encrypted)
• Wiz → Security Graph: Relationship mapping
```

**What It Protects:**
- ✅ Compute instances (full filesystem scan)
- ✅ Storage buckets (configuration & exposure)
- ✅ Kubernetes clusters (manifest & runtime)
- ✅ Databases (configuration & network exposure)
- ✅ Network configurations (security groups, routing)
- ✅ Secrets (detects hardcoded credentials)

**Security Rules Enforced:**

| Rule ID | Severity | Requirement | Enforcement |
|---------|----------|-------------|-------------|
| WIZ-001 | 🔴 Critical | Connector uses least-privilege IAM | Validates permissions |
| WIZ-002 | 🔴 High | Snapshot encryption enabled | Protects data at rest |
| WIZ-003 | 🔴 High | Attack path analysis enabled | Ensures visibility |
| WIZ-004 | 🟡 Medium | Network exposure detection on | Identifies public resources |

**Required Permissions:**
- **AWS:** `ReadOnlyAccess`, `ec2:CreateSnapshot`, `ec2:DeleteSnapshot`
- **Azure:** `Reader`, `Disk Snapshot Contributor`
- **GCP:** `Viewer`, `Compute Storage Admin`

**Visual Indicators in Platform:**
- 🔍 Security graph overlay showing resource relationships
- 🎯 Attack path lines from internet → data
- 🔐 Secret detection markers on resources
- 🦠 Malware/vulnerability badges

---

### 3. Microsoft Defender for Cloud

**What It Does:**
Microsoft Defender for Cloud (formerly Azure Security Center) provides unified security management and threat protection across multi-cloud environments with a focus on Azure-native integration.

**How It Connects to Architecture:**

```
Architecture Layer: Cloud-Native Layer
Connection Type: Native Integration + Agents
Scan Method: Agentless + Agent-based

Connection Pattern:
┌──────────────────────┐
│ Defender for Cloud   │
│ (Azure Platform)     │
└──────┬───────────────┘
       │
       ├──── Azure Fabric ─────► ┌────────────────┐
       │                         │ Azure Resources│
       │                         └────────────────┘
       │
       ├──── Multi-Cloud ──────► ┌────────────────┐
       │    Connectors           │ AWS/GCP Accts  │
       │                         └────────────────┘
       │
       ├──── Defender Agents ──► ┌────────────────┐
       │                         │ VMs/Containers │
       │                         └────────────────┘
       │
       └──── JIT Access ────────► SSH/RDP (temp)

Data Flows:
• Defender Agents → Log Analytics: Security events (HTTPS:443)
• Azure Resources → Defender: Resource metadata (Azure Fabric)
• Defender → Protected VMs: JIT management access
```

**What It Protects:**
- ✅ Virtual Machines (agent-based protection)
- ✅ Containers & Kubernetes (runtime protection)
- ✅ Storage accounts (threat detection)
- ✅ Databases (vulnerability assessment)
- ✅ Network (adaptive hardening)
- ✅ Key Vaults (access monitoring)

**Security Rules Enforced:**

| Rule ID | Severity | Requirement | Enforcement |
|---------|----------|-------------|-------------|
| DEF-001 | 🔴 Critical | All VMs have Defender for Servers | Validates coverage |
| DEF-002 | 🔴 High | JIT VM access enabled | Reduces attack surface |
| DEF-003 | 🔴 High | Defender for Containers on K8s | Protects containers |
| DEF-004 | 🟡 Medium | Auto-provisioning enabled | Ensures automation |

**Required Permissions:**
- **Azure:** `Security Admin`, `Contributor`
- **AWS:** `SecurityAudit`, `ReadOnlyAccess`
- **GCP:** `Security Reviewer`

**Visual Indicators in Platform:**
- 🛡️ Shield icon on protected resources
- ⏱️ JIT access indicators on VMs
- 📋 Compliance score per subscription
- 🚨 Security alerts overlaid on affected resources

---

## Endpoint Security

### 4. CrowdStrike Falcon Endpoint Security

**What It Does:**
CrowdStrike Falcon provides cloud-native endpoint protection with EDR (Endpoint Detection and Response), antivirus, and threat intelligence for servers, VMs, and containers.

**How It Connects to Architecture:**

```
Architecture Layer: Endpoint Layer
Connection Type: Agent-based
Scan Method: Real-time kernel-level monitoring

Connection Pattern:
┌──────────────────────┐
│ CrowdStrike Cloud    │
│ (Falcon Platform)    │
└──────┬───────────────┘
       │
       │ ◄──── Telemetry (HTTPS:443) ────┐
       │                                  │
       │ ───── Threat Intel ─────────►   │
       │                                  │
       │                          ┌───────┴────────┐
       │                          │ Falcon Agents  │
       │                          │ (on all VMs)   │
       │                          └───────┬────────┘
       │                                  │
       └──────────────────────────────────┼─────────
                                          │
                                   ┌──────┴─────────┐
                                   │ Kernel Hooks   │
                                   │ Process Monitor│
                                   └────────────────┘

Data Flows:
• Falcon Agents → CrowdStrike Cloud: Telemetry (HTTPS:443)
• CrowdStrike Cloud → Agents: Threat indicators (HTTPS:443)
• Agents → Local Processes: Kernel-level monitoring
```

**What It Protects:**
- ✅ EC2 Instances (Windows/Linux)
- ✅ Azure VMs
- ✅ GCP Compute Engines
- ✅ Kubernetes nodes (container runtime)
- ✅ On-premise servers

**Security Rules Enforced:**

| Rule ID | Severity | Requirement | Enforcement |
|---------|----------|-------------|-------------|
| CS-001 | 🔴 Critical | All compute must have Falcon agent | Validates full coverage |
| CS-002 | 🔴 Critical | Prevention policy enabled in prod | Blocks threats |
| CS-003 | 🔴 High | Network access to CrowdStrike cloud | Validates connectivity |
| CS-004 | 🟡 Medium | Container security for K8s | Protects containers |

**Required Permissions:**
- **Compute:** `root/administrator`, `kernel_module_load`

**Visual Indicators in Platform:**
- 🦅 Falcon icon on protected instances
- 🟢 Green: Agent active & healthy
- 🟡 Yellow: Agent installed but inactive
- 🔴 Red: Missing agent
- ⚡ Real-time threat detection status

---

## Identity & Access Management

### 5. Okta Workforce Identity

**What It Does:**
Okta provides identity and access management with SSO (Single Sign-On), MFA (Multi-Factor Authentication), and user lifecycle management for cloud applications and infrastructure.

**How It Connects to Architecture:**

```
Architecture Layer: Identity Layer
Connection Type: Identity Provider (IdP)
Scan Method: Authentication flow analysis

Connection Pattern:
                    ┌────────────┐
                    │  Users     │
                    └─────┬──────┘
                          │
                          │ (1) Auth Request
                          ▼
                    ┌────────────┐
                    │   Okta     │
                    │    IdP     │
                    └─────┬──────┘
                          │
            ┌─────────────┼──────────────┐
            │             │              │
       (2) SAML      (2) OIDC      (2) API Auth
            │             │              │
            ▼             ▼              ▼
    ┌──────────┐   ┌──────────┐   ┌──────────┐
    │  AWS     │   │  Azure   │   │  Apps    │
    │ Console  │   │ Portal   │   │ (K8s,etc)│
    └──────────┘   └──────────┘   └──────────┘

Data Flows:
• Users → Okta: Authentication requests (HTTPS:443)
• Okta → Cloud Console: SAML/OIDC assertions (HTTPS:443)
• Applications → Okta: Authorization requests (HTTPS:443)
```

**What It Protects:**
- ✅ Cloud console access (AWS, Azure, GCP)
- ✅ Kubernetes API server
- ✅ Application access
- ✅ Admin/privileged accounts
- ✅ Service account authentication

**Security Rules Enforced:**

| Rule ID | Severity | Requirement | Enforcement |
|---------|----------|-------------|-------------|
| OKTA-001 | 🔴 Critical | MFA enforced for cloud console | Blocks weak auth |
| OKTA-002 | 🔴 Critical | Privileged accounts use FIDO2/WebAuthn | Phishing-resistant MFA |
| OKTA-003 | 🔴 High | Session timeout ≤8 hours | Limits exposure |
| OKTA-004 | 🟡 Medium | Adaptive auth enabled | Risk-based access |
| OKTA-005 | 🔴 High | API tokens have expiration | Prevents token abuse |

**Visual Indicators in Platform:**
- 🔐 Identity federation paths shown
- ✅ MFA enforcement indicators
- 👤 User access flows to resources
- 🎫 SSO integration points

---

## SASE / Zero Trust

### 6. Cloudflare One

**What It Does:**
Cloudflare One provides Zero Trust Network Access (ZTNA), Secure Web Gateway (SWG), and Cloud Access Security Broker (CASB) at the network edge.

**How It Connects to Architecture:**

```
Architecture Layer: Edge Security Layer
Connection Type: Edge Proxy
Scan Method: Traffic inspection at edge

Connection Pattern:
    ┌──────────┐
    │  Users   │
    └────┬─────┘
         │
         │ WARP Client
         ▼
┌─────────────────────┐
│  Cloudflare Edge    │
│  (Global Network)   │
└────────┬────────────┘
         │
    ┌────┴──────────────────┐
    │                       │
    │ Zero Trust Policies   │
    │  • DNS Filtering      │
    │  • HTTP Inspection    │
    │  • DLP                │
    │                       │
    └────┬──────────────────┘
         │
    ┌────┴────────┬──────────┐
    │             │          │
    ▼             ▼          ▼
┌────────┐  ┌─────────┐  ┌──────────┐
│Internet│  │ SaaS    │  │ Private  │
│Services│  │ Apps    │  │ Apps     │
└────────┘  └─────────┘  └──────────┘
                              ▲
                              │
                        Cloudflare Tunnel
                              │
                         ┌────┴─────┐
                         │ Cloud    │
                         │ Resources│
                         └──────────┘

Data Flows:
• Users → Cloudflare Edge: All requests (HTTPS:443)
• Cloudflare Edge → Protected Apps: Proxied requests
• Cloudflare Tunnels → Private Resources: Secure access
```

**What It Protects:**
- ✅ Web application access
- ✅ SaaS application usage
- ✅ Private application access (via Tunnel)
- ✅ DNS queries (malware/phishing protection)
- ✅ API traffic

**Security Rules Enforced:**

| Rule ID | Severity | Requirement | Enforcement |
|---------|----------|-------------|-------------|
| CF-001 | 🔴 Critical | Zero Trust policies configured | Blocks unprotected access |
| CF-002 | 🔴 High | Gateway DNS filtering enabled | Blocks malicious domains |
| CF-003 | 🔴 High | HTTP inspection enabled | Detects threats in traffic |
| CF-004 | 🟡 Medium | CASB integration configured | Monitors SaaS usage |

**Visual Indicators in Platform:**
- 🌐 Edge security layer shown
- 🔒 Zero Trust policy enforcement points
- 🛡️ Protected application markers
- 📊 Traffic inspection indicators

---

### 7. Zscaler Zero Trust Exchange

**What It Does:**
Zscaler delivers a cloud-native SASE platform with Zero Trust Network Access, cloud firewall, and advanced threat protection through inline traffic inspection.

**How It Connects to Architecture:**

```
Architecture Layer: Edge Security Layer
Connection Type: Cloud Proxy
Scan Method: Inline inspection

Connection Pattern:
    ┌──────────┐
    │  Users   │
    └────┬─────┘
         │ Client Connector
         ▼
┌─────────────────────┐
│   Zscaler Cloud     │
│  (ZIA + ZPA)        │
└────────┬────────────┘
         │
    ┌────┴───────────────┐
    │                    │
    │ Security Services: │
    │  • SSL Inspection  │
    │  • Cloud Firewall  │
    │  • DLP             │
    │  • Sandboxing      │
    │                    │
    └────┬───────────────┘
         │
    ┌────┴──────┬────────────┐
    │           │             │
    ▼           ▼             ▼
┌────────┐  ┌──────────┐  ┌──────────┐
│Internet│  │ Cloud    │  │ Private  │
│        │  │ Apps     │  │ Apps     │
└────────┘  └──────────┘  └────┬─────┘
                                │
                         ┌──────┴──────┐
                         │ App         │
                         │ Connectors  │
                         │ (in cloud)  │
                         └─────────────┘

Data Flows:
• Users → Zscaler Edge: All traffic (IPsec/GRE)
• Zscaler → Internet: Inspected traffic (HTTPS:443)
• App Connectors → Zscaler: App registration
• Zscaler → Private Apps: Zero Trust access
```

**What It Protects:**
- ✅ All user internet traffic
- ✅ Cloud application access
- ✅ Private application access
- ✅ Data exfiltration attempts
- ✅ Malware/phishing threats

**Security Rules Enforced:**

| Rule ID | Severity | Requirement | Enforcement |
|---------|----------|-------------|-------------|
| ZS-001 | 🔴 Critical | App connectors in every region | Ensures redundancy |
| ZS-002 | 🔴 Critical | SSL inspection enabled | Detects encrypted threats |
| ZS-003 | 🔴 High | DLP policies configured | Prevents data loss |
| ZS-004 | 🟡 Medium | Firewall rules optimized | Improves performance |

**Visual Indicators in Platform:**
- 🔵 Zscaler edge nodes displayed
- 🔌 App connector locations marked
- 🔐 Zero Trust access paths
- 🚨 Threat detection points

---

## Observability

### 8. Datadog Infrastructure Monitoring

**What It Does:**
Datadog provides unified observability with infrastructure monitoring, APM (Application Performance Monitoring), log management, and security monitoring across your entire stack.

**How It Connects to Architecture:**

```
Architecture Layer: Observability Layer
Connection Type: Agent Telemetry
Scan Method: Metrics/logs/traces collection

Connection Pattern:
┌──────────────────────────────┐
│     Datadog Platform         │
│  (Metrics, Logs, Traces)     │
└────────────┬─────────────────┘
             │
        ◄────┴──── Telemetry (HTTPS:443)
             │
    ┌────────┴────────────────────┐
    │                             │
    │  Datadog Agents on:         │
    │   • EC2/VMs                 │
    │   • Kubernetes (DaemonSet)  │
    │   • Containers              │
    │   • Serverless              │
    │                             │
    └───────┬─────────────────────┘
            │
       ┌────┴────┐
       │         │
       ▼         ▼
  ┌────────┐  ┌─────────┐
  │ Metrics│  │  Logs   │
  │  CPU   │  │ App logs│
  │  Mem   │  │ Sys logs│
  │  Net   │  │ Audit   │
  └────────┘  └─────────┘

Data Flows:
• Datadog Agents → Intake: Metrics/logs/traces (HTTPS:443)
• Cloud APIs → Datadog: Resource metadata
• Datadog → Alert Channels: Notifications
```

**What It Protects:**
- ✅ Infrastructure health monitoring
- ✅ Application performance
- ✅ Security event detection
- ✅ Compliance monitoring
- ✅ Network performance

**Security Rules Enforced:**

| Rule ID | Severity | Requirement | Enforcement |
|---------|----------|-------------|-------------|
| DD-001 | 🔴 High | API keys rotated regularly (90d) | Limits key exposure |
| DD-002 | 🔴 High | Sensitive data scanning enabled | Prevents PII logging |
| DD-003 | 🟡 Medium | Security monitoring enabled | Detects threats |
| DD-004 | 🟡 Medium | NPM for distributed systems | Monitors service mesh |

**Visual Indicators in Platform:**
- 📊 Telemetry coverage overlay
- 🟢 Monitored resources (agent deployed)
- 🔴 Unmonitored resources
- 📈 Performance metrics visualization

---

## Cyber Resilience

### 9. Rubrik Security Cloud

**What It Does:**
Rubrik provides cloud-native data protection with immutable backups, ransomware recovery, and cyber resilience capabilities for multi-cloud environments.

**How It Connects to Architecture:**

```
Architecture Layer: Data Protection Layer
Connection Type: Backup Orchestrator
Scan Method: Snapshot-based

Connection Pattern:
┌──────────────────────────┐
│   Rubrik Security        │
│   Cloud Platform         │
└────────┬─────────────────┘
         │
    ┌────┴────────────────────────────┐
    │                                 │
    │  Protection Policies:           │
    │   • RPO/RTO objectives          │
    │   • Immutable snapshots         │
    │   • Anomaly detection           │
    │   • Threat monitoring           │
    │                                 │
    └────┬────────────────────────────┘
         │
    ┌────┴──────┬──────────┬─────────┐
    │           │          │         │
    ▼           ▼          ▼         ▼
┌────────┐  ┌──────┐  ┌───────┐  ┌───────┐
│   VMs  │  │  DBs │  │  K8s  │  │  S3   │
│        │  │      │  │       │  │Buckets│
└────┬───┘  └───┬──┘  └───┬───┘  └───┬───┘
     │          │         │          │
     └──────────┴─────────┴──────────┘
                  │
             Snapshots
                  │
                  ▼
         ┌────────────────┐
         │ Rubrik Immutable│
         │ Storage         │
         └────────────────┘

Data Flows:
• Rubrik → Data Sources: Backup traffic (HTTPS/SMB)
• Snapshots → Rubrik Storage: Deduplicated data
• Rubrik → Archive Storage: Long-term retention
```

**What It Protects:**
- ✅ Virtual machines (VMware, Hyper-V, Cloud VMs)
- ✅ Databases (SQL, Oracle, MongoDB, etc.)
- ✅ Kubernetes (namespaces, PVCs)
- ✅ Cloud storage (S3, Blob, Cloud Storage)
- ✅ File systems

**Security Rules Enforced:**

| Rule ID | Severity | Requirement | Enforcement |
|---------|----------|-------------|-------------|
| RUB-001 | 🔴 Critical | Immutable backups enabled | Ransomware protection |
| RUB-002 | 🔴 Critical | DB backup SLA <4 hours RPO | Validates coverage |
| RUB-003 | 🔴 High | Backup encryption enabled | Protects at rest |
| RUB-004 | 🔴 High | Air-gapped copies configured | Additional protection |
| RUB-005 | 🟡 Medium | Anomaly detection enabled | Identifies attacks |

**Visual Indicators in Platform:**
- 💾 Backup protection badges on resources
- ⏱️ RPO/RTO indicators
- 🔒 Immutable backup markers
- 📊 Protection coverage percentage

---

## Secrets Management

### 10. HashiCorp Vault

**What It Does:**
HashiCorp Vault provides centralized secrets management with dynamic credential generation, encryption-as-a-service, and comprehensive audit logging.

**How It Connects to Architecture:**

```
Architecture Layer: Secrets Plane
Connection Type: Secrets Provider
Scan Method: API-based access

Connection Pattern:
┌──────────────────────────┐
│   HashiCorp Vault        │
│   (HA Cluster)           │
│    • KV Secrets          │
│    • Dynamic DB Creds    │
│    • PKI/Certificates    │
│    • Transit Encryption  │
└────────┬─────────────────┘
         │
    ┌────┴──────────────────────┐
    │                           │
    │  Authentication:          │
    │   • Kubernetes            │
    │   • AWS IAM               │
    │   • Azure AD              │
    │   • AppRole               │
    │                           │
    └────┬──────────────────────┘
         │
    ┌────┴────────────┬──────────┐
    │                 │          │
    ▼                 ▼          ▼
┌─────────┐    ┌──────────┐  ┌────────┐
│ Apps    │    │ Services │  │  DBs   │
│ (Pods)  │    │ (VMs)    │  │ (Creds)│
└─────────┘    └──────────┘  └────────┘
     │              │              ▲
     │              │              │
     └──────────────┴──────────────┘
                    │
              Secrets Retrieved
                    │
         ┌──────────┴─────────┐
         │  Audit Logs        │
         │  (all access       │
         │   recorded)        │
         └────────────────────┘

Data Flows:
• Applications → Vault: Secret requests (HTTPS:8200)
• Vault → Applications: Secrets/credentials
• Vault → Cloud IAM: Dynamic credential generation (API)
• Vault → Audit Logs: Access audit (file/syslog)
```

**What It Protects:**
- ✅ Database credentials (dynamic generation)
- ✅ API keys and tokens
- ✅ TLS certificates (PKI)
- ✅ Cloud IAM credentials (AWS, Azure, GCP)
- ✅ Encryption keys

**Security Rules Enforced:**

| Rule ID | Severity | Requirement | Enforcement |
|---------|----------|-------------|-------------|
| VAULT-001 | 🔴 Critical | HA with minimum 3 replicas | Ensures availability |
| VAULT-002 | 🔴 Critical | Auto-unseal configured (KMS) | Prevents manual intervention |
| VAULT-003 | 🔴 Critical | Root tokens revoked | Forces auth methods |
| VAULT-004 | 🔴 High | Audit logging enabled | Tracks all access |
| VAULT-005 | 🔴 High | Dynamic secrets preferred | Eliminates static creds |
| VAULT-006 | 🟡 Medium | Short TTL leases (≤1 hour) | Limits exposure |
| VAULT-007 | 🔴 High | TLS enforced for all clients | Protects in transit |

**Visual Indicators in Platform:**
- 🔑 Secret paths from Vault to consumers
- 🔄 Dynamic credential generation flows
- 🔐 Encrypted secrets indicators
- 📜 Audit logging enabled markers

---

## Cross-Product Security Matrix

| Product | Agent Required | API Access Required | Network Access | Cloud Permissions | Cost Model |
|---------|---------------|---------------------|----------------|-------------------|------------|
| **Prisma Cloud** | Optional | ✅ Read-only | ✅ HTTPS:443 outbound | Read, SecurityAudit | Usage-based |
| **Wiz** | ❌ Agentless | ✅ Read + Snapshot | ✅ HTTPS:443 outbound | Read, Snapshot | Asset-based |
| **Defender** | ✅ Required | ✅ Native Azure | ✅ HTTPS:443 outbound | Security Admin | Per-resource |
| **CrowdStrike** | ✅ Required | ❌ Optional | ✅ HTTPS:443 outbound | VM access | Per-endpoint |
| **Okta** | ❌ N/A | ✅ Required | ✅ HTTPS:443 outbound | None (IdP) | Per-user |
| **Cloudflare** | Client-side | ✅ Required | ✅ HTTPS:443 bidirect | DNS control | Per-user |
| **Zscaler** | ✅ Required | ✅ Required | ✅ IPsec/HTTPS | Connector deploy | Per-user |
| **Datadog** | ✅ Required | ✅ Optional | ✅ HTTPS:443 outbound | Read metadata | Per-host |
| **Rubrik** | ❌ Optional | ✅ Required | ✅ HTTPS:443 bidirect | Snapshot, Backup | Capacity |
| **Vault** | ❌ N/A | ✅ Required | ✅ HTTPS:8200 outbound | IAM create | OSS/Enterprise |

---

## Implementation Checklist

### Phase 1: Visibility (Weeks 1-2)
- [ ] Deploy Prisma Cloud or Wiz for CSPM
- [ ] Enable Datadog for observability
- [ ] Configure Vault for secrets

### Phase 2: Protection (Weeks 3-4)
- [ ] Deploy CrowdStrike Falcon agents
- [ ] Enable Defender for Cloud (if Azure-heavy)
- [ ] Configure Okta SSO/MFA

### Phase 3: Zero Trust (Weeks 5-6)
- [ ] Implement Cloudflare One or Zscaler
- [ ] Enable JIT access where available
- [ ] Configure network segmentation

### Phase 4: Resilience (Weeks 7-8)
- [ ] Deploy Rubrik backup policies
- [ ] Test disaster recovery procedures
- [ ] Configure immutable backups

---

## Support & Documentation

- **Platform Documentation:** [/docs](/docs)
- **Integration Guides:** [/docs/integrations](/docs/integrations)
- **Security Rules Reference:** `/lib/security/integration-rules.ts`
- **Compliance Mapping:** [/docs/compliance](/docs/compliance)

For questions or support, contact your security team or visit the vendor documentation links in each product's integration node.
