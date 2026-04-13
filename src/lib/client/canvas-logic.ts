import type { Node, Edge } from "@xyflow/svelte";

export interface CloudNodeData extends Record<string, unknown> {
    type: string;
    label: string;
    provider: string;
    cidr?: string;
    size?: string;
    disk?: number;
    count?: number;
}

export type AppNode = Node<CloudNodeData>;
export type AppEdge = Edge;

export class CanvasLogic {
    static getAbsolutePos(n: AppNode, nodes: AppNode[]) {
        let x = n.position.x;
        let y = n.position.y;
        let curr = n;
        while (curr.parentId) {
            const parentId: string = curr.parentId;
            const parent = nodes.find((p) => p.id === parentId);
            if (parent) {
                x += parent.position.x;
                y += parent.position.y;
                curr = parent;
            } else break;
        }
        return { x, y };
    }

    static findParentContainer(
        nodes: AppNode[],
        position: { x: number; y: number },
        excludeId?: string
    ): AppNode | undefined {
        return [...nodes].reverse().find((n) => {
            if (n.type !== "cloud" || n.id === excludeId) return false;

            const isContainerType = [
                "vpc",
                "vnet",
                "securityGroup",
                "networkGroup",
                "kubernetes",
                "k8sNode",
            ].includes(n.data.type);
            if (!isContainerType) return false;

            const pAbs = this.getAbsolutePos(n, nodes);
            const width = n.measured?.width || 500;
            const height = n.measured?.height || 400;

            const tol = 50; // Drop tolerance
            return (
                position.x >= pAbs.x - tol &&
                position.x <= pAbs.x + width + tol &&
                position.y >= pAbs.y - tol &&
                position.y <= pAbs.y + height + tol
            );
        });
    }

    static canNestResource(
        parent: AppNode,
        childType: string,
        childProvider: string
    ): boolean {
        if (["vpc", "vnet"].includes(childType)) return false;

        if (childType === "kubernetes") {
            // EKS/AKS/GKE must be in VPC/VNet of same provider
            return (
                ["vpc", "vnet"].includes(parent.data.type) &&
                parent.data.provider === childProvider
            );
        }

        if (childProvider === "kubernetes") {
            // K8s resources inside K8s containers
            if (parent.data.type === "kubernetes") return true;
            if (parent.data.type === "k8sNode" && childType !== "k8sNode") return true;
            return false;
        }

        // Standard cloud resources same provider
        return parent.data.provider === childProvider;
    }
}
