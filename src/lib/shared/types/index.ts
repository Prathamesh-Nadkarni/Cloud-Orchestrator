import type { CloudConnectionDTO, ThreatRuleDTO, FindingDTO } from '../schemas';

export type TenantId = string;
export type UserId = string;
export type ConnectionId = string;
export type RoleId = string;

export interface ValidationResult<T> {
    success: boolean;
    data?: T;
    error?: string;
}

export interface PaginatedResult<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
}
