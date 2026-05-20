// Shared constants used across multiple API routes

export const MONTHS: Record<string, number> = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
};

export const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const TASK_TYPES: Record<string, { label: string; color: string; icon: string }> = {
    tds: { label: "TDS Payment", color: "#FF6B6B", icon: "TDS" },
    TDS_PAYMENT: { label: "TDS Payment", color: "#FF6B6B", icon: "TDS" },
    TDS_RETURN: { label: "TDS Return", color: "#FF6B6B", icon: "TDS" },
    gstr1: { label: "GSTR-1 Filing", color: "#FFB020", icon: "G1" },
    GST_1: { label: "GSTR-1 Filing", color: "#FFB020", icon: "G1" },
    GSTR_1: { label: "GSTR-1 Filing", color: "#FFB020", icon: "G1" },
    pf_esi_pt: { label: "PF / ESI / PT", color: "#4FACFE", icon: "PF" },
    PF_ESI_PT: { label: "PF / ESI / PT", color: "#4FACFE", icon: "PF" },
    gstr3b: { label: "GSTR-3B Filing", color: "#00D4AA", icon: "3B" },
    GSTR_3B: { label: "GSTR-3B Filing", color: "#00D4AA", icon: "3B" },
    GSTR3B: { label: "GSTR-3B Filing", color: "#00D4AA", icon: "3B" },
};

export const STATUS_OPTIONS = ["PENDING", "IN_PROGRESS", "UNDER_REVIEW", "BLOCKED", "COMPLETED"] as const;

export const PRIORITY_OPTIONS = ["high", "medium", "low"] as const;
