import { api } from './api';

export type AuditCategory =
    'AUTH' |
    'USER_MANAGEMENT' |
    'PACKAGE' |
    'BOOKING' |
    'PAYMENT' |
    'SYSTEM' |
    'APPOINTMENT' |
    'STORE' |
    'WORKSHOP';


export interface AuditLogItem {
    id: string;
    category: AuditCategory;
    action: string;
    ipAddress?: string;
    userAgent?: string;
    details?: Record<string, unknown>;
    createdAt: string;
    actor?: {
        id: string;
        name: string;
        email: string;
        role: string;
    };
    studio?: {
        id: string;
        name: string;
        subdomain: string;
    };
}

export interface AuditLogResponse {
    logs: AuditLogItem[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface AuditLogFilterParams {
    actorId?: string;
    category?: AuditCategory | 'ALL';
    action?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
}

export const auditLogApi = {
    // Audit Logları Listele
    getLogs: async (params: AuditLogFilterParams = {}): Promise<AuditLogResponse> => {
        const queryParams: Record<string, string> = {};

        if (params.actorId) queryParams.actorId = params.actorId;
        if (params.category && params.category !== 'ALL') queryParams.category = params.category;
        if (params.action) queryParams.action = params.action;
        if (params.startDate) queryParams.startDate = params.startDate;
        if (params.endDate) queryParams.endDate = params.endDate;
        if (params.page) queryParams.page = String(params.page);
        if (params.limit) queryParams.limit = String(params.limit);

        const res = await api.get('/auditlogs', { params: queryParams });
        return res.data.data;
    },

    // Tekil Log Detayını Getir
    getLogById: async (id: string): Promise<AuditLogItem> => {
        const res = await api.get(`/auditlogs/${id}`);
        return res.data.data;
    },
};