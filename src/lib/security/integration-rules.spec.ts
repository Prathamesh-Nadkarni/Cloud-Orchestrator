import { describe, it, expect } from 'vitest';
import { SECURITY_INTEGRATION_RULES } from './integration-rules';

describe('SECURITY_INTEGRATION_RULES', () => {
  const ruleKeys = Object.keys(SECURITY_INTEGRATION_RULES);

  it('defines at least 10 products', () => {
    expect(ruleKeys.length).toBeGreaterThanOrEqual(10);
  });

  it.each(ruleKeys)('product "%s" has productName', (key) => {
    expect(SECURITY_INTEGRATION_RULES[key].productName).toBeTruthy();
  });

  it.each(ruleKeys)('product "%s" has category', (key) => {
    expect(SECURITY_INTEGRATION_RULES[key].category).toBeTruthy();
  });

  it.each(ruleKeys)('product "%s" has connectionPattern with type', (key) => {
    const cp = SECURITY_INTEGRATION_RULES[key].connectionPattern;
    expect(cp).toBeDefined();
    expect(cp.type).toBeTruthy();
  });

  it.each(ruleKeys)('product "%s" has architectureIntegration with placement', (key) => {
    const ai = SECURITY_INTEGRATION_RULES[key].architectureIntegration;
    expect(['external', 'inside_vpc']).toContain(ai.placement);
  });

  it.each(ruleKeys)('product "%s" has at least 1 security rule', (key) => {
    const rules = SECURITY_INTEGRATION_RULES[key].securityRules;
    expect(Array.isArray(rules)).toBe(true);
    expect(rules.length).toBeGreaterThanOrEqual(1);
  });

  it.each(ruleKeys)('product "%s" security rules have validate functions', (key) => {
    const rules = SECURITY_INTEGRATION_RULES[key].securityRules;
    for (const rule of rules) {
      expect(rule.id || rule.name).toBeTruthy();
      expect(rule.severity).toBeTruthy();
      expect(typeof (rule.validate || rule.validation)).toBe('function');
    }
  });

  it.each(ruleKeys)('product "%s" has protectionCapabilities object', (key) => {
    const pc = SECURITY_INTEGRATION_RULES[key].protectionCapabilities;
    expect(typeof pc).toBe('object');
    expect(pc).toBeTruthy();
  });
});
