import { z } from "zod";

export const clientSchema = z.object({
    name: z.string().min(1, "Name is required"),
    entityType: z.string().default("Proprietorship"),
    gstCategory: z.enum(["MONTHLY", "QUARTERLY", "EXEMPT"]).default("MONTHLY"),
    gstin: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, "Invalid GSTIN").optional().or(z.literal("")),
    pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN").optional().or(z.literal("")),
    tan: z.string().regex(/^[A-Z]{4}[0-9]{5}[A-Z]{1}$/, "Invalid TAN").optional().or(z.literal("")),
    contactEmail: z.string().email("Invalid email").optional().or(z.literal("")),
    contactPhone: z.string().optional().or(z.literal("")),
});

export const taskSchema = z.object({
    title: z.string().min(1),
    taskType: z.string(),
    priority: z.enum(["high", "medium", "low"]).default("medium"),
    status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "BLOCKED", "UNDER_REVIEW"]).default("PENDING"),
    dueDate: z.string().optional().or(z.null()),
    frequency: z.string().default("ONCE"),
    period: z.string().optional().or(z.null()),
});
