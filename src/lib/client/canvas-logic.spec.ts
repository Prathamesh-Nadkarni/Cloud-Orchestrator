import { describe, it, expect } from 'vitest';
import { CanvasLogic, type AppNode } from './canvas-logic';

function makeNode(overrides: Partial<AppNode> & { id: string; data: any }): AppNode {
  return {
    position: { x: 0, y: 0 },
    type: 'cloud',
    ...overrides,
  } as AppNode;
}

describe('CanvasLogic', () => {
  describe('getAbsolutePos', () => {
    it('returns node position when there is no parent', () => {
      const node = makeNode({ id: 'a', position: { x: 100, y: 200 }, data: { type: 'compute', label: '', provider: 'aws' } });
      const pos = CanvasLogic.getAbsolutePos(node, [node]);
      expect(pos).toEqual({ x: 100, y: 200 });
    });

    it('accumulates parent offsets', () => {
      const parent = makeNode({ id: 'vpc', position: { x: 50, y: 60 }, data: { type: 'vpc', label: '', provider: 'aws' } });
      const child = makeNode({ id: 'ec2', position: { x: 10, y: 20 }, parentId: 'vpc', data: { type: 'compute', label: '', provider: 'aws' } });
      const pos = CanvasLogic.getAbsolutePos(child, [parent, child]);
      expect(pos).toEqual({ x: 60, y: 80 });
    });

    it('handles deep nesting (grandparent → parent → child)', () => {
      const grandparent = makeNode({ id: 'vpc', position: { x: 100, y: 100 }, data: { type: 'vpc', label: '', provider: 'aws' } });
      const parent = makeNode({ id: 'subnet', position: { x: 20, y: 30 }, parentId: 'vpc', data: { type: 'subnet', label: '', provider: 'aws' } });
      const child = makeNode({ id: 'ec2', position: { x: 5, y: 5 }, parentId: 'subnet', data: { type: 'compute', label: '', provider: 'aws' } });
      const pos = CanvasLogic.getAbsolutePos(child, [grandparent, parent, child]);
      expect(pos).toEqual({ x: 125, y: 135 });
    });

    it('stops walking when parent is not found', () => {
      const child = makeNode({ id: 'ec2', position: { x: 10, y: 20 }, parentId: 'missing', data: { type: 'compute', label: '', provider: 'aws' } });
      const pos = CanvasLogic.getAbsolutePos(child, [child]);
      expect(pos).toEqual({ x: 10, y: 20 });
    });
  });

  describe('canNestResource', () => {
    const awsVpc = makeNode({ id: 'vpc1', data: { type: 'vpc', label: 'VPC', provider: 'aws' } });
    const azureVnet = makeNode({ id: 'vnet1', data: { type: 'vnet', label: 'VNet', provider: 'azure' } });
    const k8sCluster = makeNode({ id: 'k8s1', data: { type: 'kubernetes', label: 'EKS', provider: 'aws' } });
    const k8sNode = makeNode({ id: 'k8sn1', data: { type: 'k8sNode', label: 'Node', provider: 'kubernetes' } });

    it('allows AWS compute inside AWS VPC', () => {
      expect(CanvasLogic.canNestResource(awsVpc, 'compute', 'aws')).toBe(true);
    });

    it('blocks Azure compute inside AWS VPC (provider mismatch)', () => {
      expect(CanvasLogic.canNestResource(awsVpc, 'compute', 'azure')).toBe(false);
    });

    it('blocks VPC inside another VPC', () => {
      expect(CanvasLogic.canNestResource(awsVpc, 'vpc', 'aws')).toBe(false);
    });

    it('blocks VNet inside VNet', () => {
      expect(CanvasLogic.canNestResource(azureVnet, 'vnet', 'azure')).toBe(false);
    });

    it('allows Kubernetes cluster inside same-provider VPC', () => {
      expect(CanvasLogic.canNestResource(awsVpc, 'kubernetes', 'aws')).toBe(true);
    });

    it('blocks Kubernetes cluster inside different-provider VPC', () => {
      expect(CanvasLogic.canNestResource(azureVnet, 'kubernetes', 'aws')).toBe(false);
    });

    it('allows K8s pod inside K8s cluster', () => {
      expect(CanvasLogic.canNestResource(k8sCluster, 'k8sPod', 'kubernetes')).toBe(true);
    });

    it('allows K8s pod inside K8s node', () => {
      expect(CanvasLogic.canNestResource(k8sNode, 'k8sPod', 'kubernetes')).toBe(true);
    });

    it('blocks K8s resources inside a regular VPC', () => {
      expect(CanvasLogic.canNestResource(awsVpc, 'k8sPod', 'kubernetes')).toBe(false);
    });
  });

  describe('findParentContainer', () => {
    it('finds a VPC at the drop position', () => {
      const vpc = makeNode({
        id: 'vpc',
        position: { x: 100, y: 100 },
        data: { type: 'vpc', label: 'VPC', provider: 'aws' },
        measured: { width: 500, height: 400 },
      });
      const result = CanvasLogic.findParentContainer([vpc], { x: 200, y: 200 });
      expect(result?.id).toBe('vpc');
    });

    it('returns undefined when position is outside all containers', () => {
      const vpc = makeNode({
        id: 'vpc',
        position: { x: 100, y: 100 },
        data: { type: 'vpc', label: 'VPC', provider: 'aws' },
        measured: { width: 500, height: 400 },
      });
      const result = CanvasLogic.findParentContainer([vpc], { x: 2000, y: 2000 });
      expect(result).toBeUndefined();
    });

    it('excludes the specified node id', () => {
      const vpc = makeNode({
        id: 'vpc',
        position: { x: 100, y: 100 },
        data: { type: 'vpc', label: 'VPC', provider: 'aws' },
        measured: { width: 500, height: 400 },
      });
      const result = CanvasLogic.findParentContainer([vpc], { x: 200, y: 200 }, 'vpc');
      expect(result).toBeUndefined();
    });

    it('ignores non-container types', () => {
      const compute = makeNode({
        id: 'ec2',
        position: { x: 100, y: 100 },
        data: { type: 'compute', label: 'Compute', provider: 'aws' },
        measured: { width: 200, height: 200 },
      });
      const result = CanvasLogic.findParentContainer([compute], { x: 150, y: 150 });
      expect(result).toBeUndefined();
    });
  });
});
