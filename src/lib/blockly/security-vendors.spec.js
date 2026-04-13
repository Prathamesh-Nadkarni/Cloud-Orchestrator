import { describe, it, expect } from 'vitest';
import { SECURITY_VENDORS } from './security-vendors';

describe('SECURITY_VENDORS', () => {
  const vendorKeys = Object.keys(SECURITY_VENDORS);

  it('defines exactly 10 vendors', () => {
    expect(vendorKeys).toHaveLength(10);
  });

  it.each(vendorKeys)('vendor "%s" has required metadata fields', (key) => {
    const v = SECURITY_VENDORS[key];
    expect(v.name).toBeTruthy();
    expect(v.company).toBeTruthy();
    expect(v.prefix).toBeTruthy();
    expect(v.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(v.category).toBeTruthy();
    expect(v.description).toBeTruthy();
    expect(v.icon).toBeTruthy();
    expect(v.integrationMode).toBeTruthy();
  });

  it.each(vendorKeys)('vendor "%s" has hierarchy with valid placement', (key) => {
    const h = SECURITY_VENDORS[key].hierarchy;
    expect(h).toBeDefined();
    expect(['external', 'inside_vpc']).toContain(h.placement);
    expect(typeof h.nestable).toBe('boolean');
    if (h.placement === 'inside_vpc') {
      expect(h.nestsInside).toBeDefined();
      expect(Array.isArray(h.nestsInside)).toBe(true);
      expect(h.nestsInside.length).toBeGreaterThan(0);
    }
  });

  it.each(vendorKeys)('vendor "%s" has requirements object', (key) => {
    const r = SECURITY_VENDORS[key].requirements;
    expect(r).toBeDefined();
    expect(typeof r.network_access).toBe('boolean');
  });

  describe('placement classification', () => {
    it('classifies Prisma Cloud, Wiz, Okta, Rubrik as external', () => {
      const external = ['prisma_cloud', 'wiz', 'okta', 'rubrik'];
      for (const key of external) {
        expect(SECURITY_VENDORS[key].hierarchy.placement).toBe('external');
        expect(SECURITY_VENDORS[key].hierarchy.nestable).toBe(false);
      }
    });

    it('classifies Defender, CrowdStrike, Cloudflare One, Zscaler, Datadog, Vault as inside_vpc', () => {
      const inside = ['defender', 'crowdstrike', 'cloudflare_one', 'zscaler', 'datadog', 'vault'];
      for (const key of inside) {
        expect(SECURITY_VENDORS[key].hierarchy.placement).toBe('inside_vpc');
        expect(SECURITY_VENDORS[key].hierarchy.nestable).toBe(true);
      }
    });
  });
});
