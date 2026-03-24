import type { JsonValue } from "@prisma/client/runtime/library";

export type RuleAction = 'ALLOW' | 'DENY' | 'CHALLENGE' | 'QUARANTINE' | 'RATE_LIMIT' | 'INSPECT' | 'LOG_ONLY';
export type RuleLayer = 'DNAT' | 'NETWORK' | 'APPLICATION' | 'WAF' | 'RATE_LIMIT' | 'DEFAULT';

export interface DcfRule {
    id: string;
    name: string;
    priority: number;
    layer: RuleLayer;
    action: RuleAction;
    protocol: string;
    ports: number[];
    srcMatch: any;
    dstMatch: any;
    isWildcard: boolean;
    createdAt: Date;
}

export interface RuleValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    shadowedBy?: string; // ID of the rule that shadows this one
}

export class FirewallEngine {
    /**
     * Action Precedence: deny > challenge/quarantine > rate-limit > inspect > allow > log-only
     */
    private static ACTION_PRECEDENCE: Record<RuleAction, number> = {
        'DENY': 10,
        'QUARANTINE': 9,
        'CHALLENGE': 8,
        'RATE_LIMIT': 7,
        'INSPECT': 6,
        'ALLOW': 5,
        'LOG_ONLY': 1
    };

    private static LAYER_PRECEDENCE: Record<RuleLayer, number> = {
        'DNAT': 10,
        'WAF': 9,
        'RATE_LIMIT': 8,
        'NETWORK': 7,
        'APPLICATION': 6,
        'DEFAULT': 1
    };

    /**
     * Computes the effective evaluation order of rules.
     */
    static sortRules(rules: DcfRule[]): DcfRule[] {
        return [...rules].sort((a, b) => {
            // 1. Layer Precedence (if applicable per provider, here we use it as high-level group)
            if (a.layer !== b.layer) {
                return this.LAYER_PRECEDENCE[b.layer] - this.LAYER_PRECEDENCE[a.layer];
            }

            // 2. Wildcard status (Wildcards always last)
            if (a.isWildcard !== b.isWildcard) {
                return a.isWildcard ? 1 : -1;
            }

            // 3. Explicit Priority (Lower numeric = evaluated first)
            if (a.priority !== b.priority) {
                return a.priority - b.priority;
            }

            // 4. Specificity Tie-breaker
            const specA = this.calculateSpecificity(a);
            const specB = this.calculateSpecificity(b);
            if (specA !== specB) {
                return specB - specA; // More specific first
            }

            // 5. Action Precedence
            if (a.action !== b.action) {
                return this.ACTION_PRECEDENCE[b.action] - this.ACTION_PRECEDENCE[a.action];
            }

            // 6. Stable insertion order (fallback)
            return a.createdAt.getTime() - b.createdAt.getTime();
        });
    }

    /**
     * Calculates a specificity score.
     * Higher score = more specific.
     */
    static calculateSpecificity(rule: DcfRule): number {
        let score = 0;

        // Protocols
        if (rule.protocol.toUpperCase() !== 'ANY' && rule.protocol.toUpperCase() !== '*') {
            score += 100;
        }

        // Ports
        if (rule.ports.length > 0) {
            score += 50;
        }

        // Source Match
        score += this.calculateMatchSpecificity(rule.srcMatch);

        // Destination Match
        score += this.calculateMatchSpecificity(rule.dstMatch);

        return score;
    }

    private static calculateMatchSpecificity(match: any): number {
        if (!match || !match.values || match.values.length === 0) return 0;

        let score = 0;
        for (const val of match.values) {
            if (val === '0.0.0.0/0' || val === '*' || val === 'ANY') {
                score += 1;
            } else if (val.includes('/')) {
                // CIDR - more specific (larger prefix) gets higher score
                const prefix = parseInt(val.split('/')[1]);
                score += (prefix || 0) + 10;
            } else {
                // Exact identity, tag, or IP
                score += 100;
            }
        }
        return score;
    }

    /**
     * Analyzes rules for shadowing and overlapping conflicts.
     */
    static validatePolicy(rules: DcfRule[]): Map<string, RuleValidationResult> {
        const results = new Map<string, RuleValidationResult>();
        const sortedRules = this.sortRules(rules);

        for (let i = 0; i < sortedRules.length; i++) {
            const rule = sortedRules[i];
            const result: RuleValidationResult = { isValid: true, errors: [], warnings: [] };

            // Check if shadowed by any previous rule
            for (let j = 0; j < i; j++) {
                const predecessor = sortedRules[j];
                if (this.doesShadow(predecessor, rule)) {
                    result.warnings.push(`Shadowed by rule "${predecessor.name}"`);
                    result.shadowedBy = predecessor.id;
                    break;
                }
            }

            // Check for duplicate priorities
            const samePriority = sortedRules.filter(r => r.id !== rule.id && r.priority === rule.priority && r.layer === rule.layer);
            if (samePriority.length > 0) {
                result.warnings.push(`Ambiguous priority overlap with ${samePriority.length} other rule(s)`);
            }

            // Check for wildcard placement
            if (rule.isWildcard && i < sortedRules.length - 1) {
                const lowerRules = sortedRules.slice(i + 1);
                if (lowerRules.some(r => !r.isWildcard)) {
                    result.errors.push("Wildcard rule placed above specific rules");
                    result.isValid = false;
                }
            }

            results.set(rule.id, result);
        }

        return results;
    }

    /**
     * Returns true if rule A completely covers rule B, rendering B unreachable if it comes after A.
     * Simple heuristic check.
     */
    private static doesShadow(a: DcfRule, b: DcfRule): boolean {
        // Must match on protocol
        if (a.protocol !== 'ANY' && a.protocol !== '*' && a.protocol !== b.protocol) return false;

        // Must match on ports
        if (a.ports.length > 0) {
            if (b.ports.length === 0) return false;
            if (!b.ports.every(p => a.ports.includes(p))) return false;
        }

        // Logic for src/dst match shadowing would be deeper CIDR math in prod.
        // For now, we handle "ANY" shadowing.
        if (a.isWildcard && !b.isWildcard) return true;

        const srcAShadowsB = this.matchShadows(a.srcMatch, b.srcMatch);
        const dstAShadowsB = this.matchShadows(a.dstMatch, b.dstMatch);

        return srcAShadowsB && dstAShadowsB;
    }

    private static matchShadows(matchA: any, matchB: any): boolean {
        if (!matchA || !matchA.values || matchA.values.includes('*') || matchA.values.includes('ANY')) return true;
        if (!matchB || !matchB.values) return false;

        // If A has all values B has, or A is a broader CIDR (simplified)
        return matchB.values.every((v: any) => matchA.values.includes(v));
    }

    /**
     * Suggests a priority based on layer and intent.
     */
    static suggestPriority(layer: RuleLayer, existingPriorities: number[]): number {
        const ranges: Record<RuleLayer, { min: number, max: number }> = {
            'DNAT': { min: 100, max: 199 },
            'WAF': { min: 200, max: 299 },
            'RATE_LIMIT': { min: 300, max: 399 },
            'NETWORK': { min: 400, max: 599 },
            'APPLICATION': { min: 600, max: 800 },
            'DEFAULT': { min: 900, max: 999 }
        };

        const range = ranges[layer];
        for (let p = range.min; p <= range.max; p += 100) {
            if (!existingPriorities.includes(p)) return p;
        }

        // Find next available in range
        let candidate = range.min;
        while (existingPriorities.includes(candidate) && candidate < range.max) {
            candidate += 10;
        }
        return candidate;
    }
}
