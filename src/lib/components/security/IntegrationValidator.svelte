/**
 * Security Integration Validator Component
 * Shows validation results for vendor integrations
 */

<script lang="ts">
  import { AlertCircle, CheckCircle2, AlertTriangle, Info, X, ExternalLink } from 'lucide-svelte';
  import { SECURITY_INTEGRATION_RULES, validateIntegrationSecurity } from '$lib/security/integration-rules';

  let {
    vendorKey,
    config = {},
    nodes = [],
    onClose,
    onConfigUpdate
  }: {
    vendorKey: string;
    config: any;
    nodes: any[];
    onClose: () => void;
    onConfigUpdate: (config: any) => void;
  } = $props();

  const productRules = $derived(SECURITY_INTEGRATION_RULES[vendorKey]);
  const validation = $derived(validateIntegrationSecurity(vendorKey, config, nodes));

  const severityIcons = {
    critical: { icon: AlertCircle, color: '#ef4444' },
    high: { icon: AlertTriangle, color: '#f97316' },
    medium: { icon: AlertTriangle, color: '#f59e0b' },
    low: { icon: Info, color: '#3b82f6' }
  };

  function getSeverityIcon(severity: string) {
    return severityIcons[severity] || severityIcons.low;
  }
</script>

<div class="validator-modal glass-panel">
  <div class="modal-header">
    <div class="title-section">
      <h2>Security Validation: {productRules?.productName || vendorKey}</h2>
      <p class="subtitle">Review security configuration and compliance status</p>
    </div>
    <button class="close-btn" onclick={onClose}>
      <X size={20} />
    </button>
  </div>

  <div class="validation-content">
    <!-- Overall Status -->
    <div class="status-banner" class:valid={validation.valid} class:invalid={!validation.valid}>
      {#if validation.valid}
        <CheckCircle2 size={24} color="#10b981" />
        <div class="status-text">
          <h3>Configuration Valid</h3>
          <p>All critical security requirements are met</p>
        </div>
      {:else}
        <AlertCircle size={24} color="#ef4444" />
        <div class="status-text">
          <h3>Configuration Issues Found</h3>
          <p>{validation.errors.length} error(s), {validation.warnings.length} warning(s)</p>
        </div>
      {/if}
    </div>

    <!-- Connection Pattern Info -->
    {#if productRules}
      <div class="info-section">
        <h4>Architecture Integration</h4>
        <div class="integration-details">
          <div class="detail-row">
            <span class="label">Integration Mode:</span>
            <span class="value">{productRules.connectionPattern.type.replace(/_/g, ' ')}</span>
          </div>
          <div class="detail-row">
            <span class="label">Placement:</span>
            <span class="value">{productRules.architectureIntegration.placement.replace(/_/g, ' ')}</span>
          </div>
          <div class="detail-row">
            <span class="label">Visibility:</span>
            <span class="value">{productRules.architectureIntegration.visibility.replace(/_/g, ' ')}</span>
          </div>
          <div class="detail-row">
            <span class="label">Enforcement:</span>
            <span class="value">{productRules.architectureIntegration.enforcement.replace(/_/g, ' ')}</span>
          </div>
        </div>

        <div class="requirements-box">
          <h5>Setup Requirements:</h5>
          <ul>
            {#each productRules.architectureIntegration.requirements as req}
              <li>{req}</li>
            {/each}
          </ul>
        </div>
      </div>
    {/if}

    <!-- Errors Section -->
    {#if validation.errors.length > 0}
      <div class="issues-section errors">
        <h4>
          <AlertCircle size={18} color="#ef4444" />
          Critical Issues ({validation.errors.length})
        </h4>
        {#each validation.errors as error}
          <div class="issue-card error">
            <div class="issue-header">
              <svelte:component 
                this={getSeverityIcon(error.severity).icon} 
                size={16} 
                color={getSeverityIcon(error.severity).color} 
              />
              <span class="issue-id">{error.id}</span>
              <span class="severity-badge {error.severity}">{error.severity.toUpperCase()}</span>
            </div>
            <div class="issue-content">
              <p class="rule-name">{error.rule}</p>
              <p class="issue-message">{error.message}</p>
            </div>
          </div>
        {/each}
      </div>
    {/if}

    <!-- Warnings Section -->
    {#if validation.warnings.length > 0}
      <div class="issues-section warnings">
        <h4>
          <AlertTriangle size={18} color="#f59e0b" />
          Recommendations ({validation.warnings.length})
        </h4>
        {#each validation.warnings as warning}
          <div class="issue-card warning">
            <div class="issue-header">
              <svelte:component 
                this={getSeverityIcon(warning.severity).icon} 
                size={16} 
                color={getSeverityIcon(warning.severity).color} 
              />
              <span class="issue-id">{warning.id}</span>
              <span class="severity-badge {warning.severity}">{warning.severity.toUpperCase()}</span>
            </div>
            <div class="issue-content">
              <p class="rule-name">{warning.rule}</p>
              <p class="issue-message">{warning.message}</p>
            </div>
          </div>
        {/each}
      </div>
    {/if}

    <!-- All Rules Section -->
    <div class="all-rules-section">
      <h4>All Security Rules</h4>
      {#if productRules}
        {#each productRules.securityRules as rule}
          {@const isValid = rule.validation(config, nodes)}
          <div class="rule-item" class:valid={isValid} class:invalid={!isValid}>
            <div class="rule-status">
              {#if isValid}
                <CheckCircle2 size={16} color="#10b981" />
              {:else}
                <svelte:component 
                  this={getSeverityIcon(rule.severity).icon} 
                  size={16} 
                  color={getSeverityIcon(rule.severity).color} 
                />
              {/if}
            </div>
            <div class="rule-details">
              <div class="rule-header-inline">
                <span class="rule-id">{rule.id}</span>
                <span class="rule-text">{rule.rule}</span>
              </div>
              {#if !isValid}
                <p class="rule-violation">{rule.errorMessage || rule.warningMessage}</p>
              {/if}
            </div>
          </div>
        {/each}
      {/if}
    </div>

    <!-- Data Flows -->
    {#if productRules && productRules.dataFlows}
      <div class="dataflows-section">
        <h4>Expected Data Flows</h4>
        <div class="flows-list">
          {#each productRules.dataFlows as flow}
            <div class="flow-item">
              <span class="flow-from">{flow.from}</span>
              <span class="flow-arrow">→</span>
              <span class="flow-to">{flow.to}</span>
              <span class="flow-protocol">{flow.protocol}:{flow.port || 'N/A'}</span>
              <span class="flow-data">{flow.data}</span>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>

  <div class="modal-footer">
    <button class="btn-secondary" onclick={onClose}>Close</button>
    {#if !validation.valid}
      <button class="btn-primary" onclick={() => alert('Configuration guide coming soon')}>
        <ExternalLink size={16} />
        Fix Configuration
      </button>
    {/if}
  </div>
</div>

<style>
  .validator-modal {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 800px;
    max-width: 90vw;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    background: rgba(15, 23, 42, 0.98);
    border: 1px solid rgba(139, 92, 246, 0.3);
    border-radius: 16px;
    z-index: 1000;
    overflow: hidden;
  }

  .modal-header {
    padding: 24px 28px;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .title-section h2 {
    font-size: 1.4rem;
    font-weight: 600;
    margin: 0 0 4px 0;
    color: var(--text-main);
  }

  .subtitle {
    font-size: 0.9rem;
    color: var(--text-muted);
    margin: 0;
  }

  .close-btn {
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 4px;
    border-radius: 6px;
    transition: all 0.2s;
  }

  .close-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: var(--text-main);
  }

  .validation-content {
    flex: 1;
    overflow-y: auto;
    padding: 24px 28px;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .status-banner {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px;
    border-radius: 12px;
    border: 2px solid;
  }

  .status-banner.valid {
    background: rgba(16, 185, 129, 0.1);
    border-color: #10b981;
  }

  .status-banner.invalid {
    background: rgba(239, 68, 68, 0.1);
    border-color: #ef4444;
  }

  .status-text h3 {
    font-size: 1.1rem;
    font-weight: 600;
    margin: 0 0 4px 0;
    color: var(--text-main);
  }

  .status-text p {
    font-size: 0.9rem;
    color: var(--text-muted);
    margin: 0;
  }

  .info-section {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 10px;
    padding: 18px;
  }

  .info-section h4 {
    font-size: 1rem;
    font-weight: 600;
    margin: 0 0 14px 0;
    color: var(--text-main);
  }

  .integration-details {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 16px;
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .detail-row .label {
    font-size: 0.85rem;
    color: var(--text-muted);
    font-weight: 500;
  }

  .detail-row .value {
    font-size: 0.9rem;
    color: var(--text-main);
    font-weight: 500;
    text-transform: capitalize;
  }

  .requirements-box {
    background: rgba(139, 92, 246, 0.05);
    border: 1px solid rgba(139, 92, 246, 0.2);
    border-radius: 8px;
    padding: 14px;
    margin-top: 12px;
  }

  .requirements-box h5 {
    font-size: 0.85rem;
    font-weight: 600;
    margin: 0 0 10px 0;
    color: var(--accent-primary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .requirements-box ul {
    margin: 0;
    padding-left: 20px;
  }

  .requirements-box li {
    font-size: 0.85rem;
    color: var(--text-muted);
    margin-bottom: 6px;
    line-height: 1.5;
  }

  .issues-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .issues-section h4 {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 1rem;
    font-weight: 600;
    margin: 0;
    color: var(--text-main);
  }

  .issue-card {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 8px;
    padding: 14px;
    border-left: 3px solid;
  }

  .issue-card.error {
    border-left-color: #ef4444;
  }

  .issue-card.warning {
    border-left-color: #f59e0b;
  }

  .issue-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }

  .issue-id {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--text-muted);
    font-family: monospace;
  }

  .severity-badge {
    font-size: 0.7rem;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .severity-badge.critical {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
  }

  .severity-badge.high {
    background: rgba(249, 115, 22, 0.2);
    color: #f97316;
  }

  .severity-badge.medium {
    background: rgba(245, 158, 11, 0.2);
    color: #f59e0b;
  }

  .severity-badge.low {
    background: rgba(59, 130, 246, 0.2);
    color: #3b82f6;
  }

  .issue-content {
    padding-left: 24px;
  }

  .rule-name {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--text-main);
    margin: 0 0 4px 0;
  }

  .issue-message {
    font-size: 0.85rem;
    color: var(--text-muted);
    margin: 0;
    line-height: 1.5;
  }

  .all-rules-section h4 {
    font-size: 1rem;
    font-weight: 600;
    margin: 0 0 14px 0;
    color: var(--text-main);
  }

  .rule-item {
    display: flex;
    gap: 12px;
    padding: 12px;
    background: rgba(0, 0, 0, 0.15);
    border-radius: 8px;
    margin-bottom: 8px;
    border-left: 3px solid transparent;
  }

  .rule-item.valid {
    border-left-color: #10b981;
  }

  .rule-item.invalid {
    border-left-color: #f59e0b;
  }

  .rule-details {
    flex: 1;
  }

  .rule-header-inline {
    display: flex;
    gap: 10px;
    align-items: baseline;
    margin-bottom: 4px;
  }

  .rule-id {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--text-muted);
    font-family: monospace;
  }

  .rule-text {
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--text-main);
  }

  .rule-violation {
    font-size: 0.85rem;
    color: #f59e0b;
    margin: 4px 0 0 0;
    font-style: italic;
  }

  .dataflows-section h4 {
    font-size: 1rem;
    font-weight: 600;
    margin: 0 0 14px 0;
    color: var(--text-main);
  }

  .flows-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .flow-item {
    display: grid;
    grid-template-columns: 1fr auto 1fr auto 1.5fr;
    gap: 12px;
    align-items: center;
    padding: 10px;
    background: rgba(0, 0, 0, 0.15);
    border-radius: 6px;
    font-size: 0.85rem;
  }

  .flow-from, .flow-to {
    color: var(--text-main);
    font-weight: 500;
  }

  .flow-arrow {
    color: var(--accent-primary);
    font-weight: 700;
  }

  .flow-protocol {
    color: #10b981;
    font-family: monospace;
    font-size: 0.8rem;
  }

  .flow-data {
    color: var(--text-muted);
    font-style: italic;
  }

  .modal-footer {
    padding: 18px 28px;
    border-top: 1px solid var(--border-color);
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }

  .btn-primary, .btn-secondary {
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .btn-primary {
    background: var(--accent-primary);
    border: none;
    color: white;
  }

  .btn-primary:hover {
    background: #7c3aed;
  }

  .btn-secondary {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--border-color);
    color: var(--text-main);
  }

  .btn-secondary:hover {
    background: rgba(255, 255, 255, 0.1);
  }
</style>
