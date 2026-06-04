import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/encryption";
import { z } from "zod";

export const dynamic = "force-dynamic";

// Basic validation schema for onboarding
const onboardSchema = z.object({
    name: z.string().min(1, "Name is required"),
    entityType: z.string().min(1, "Entity type is required"),
    gstin: z.string().optional().nullable(),
    pan: z.string().optional().nullable(),
    tan: z.string().optional().nullable(),
    contactPerson: z.string().optional().nullable(),
    contactEmail: z.string().email("Invalid email").optional().nullable(),
    contactPhone: z.string().optional().nullable(),
    gDriveLink: z.string().url("Must be a valid URL").optional().nullable().or(z.literal("")),
    
    // Credentials
    itxLogin: z.string().optional().nullable(),
    itxPassword: z.string().optional().nullable(),
    gstLogin: z.string().optional().nullable(),
    gstPassword: z.string().optional().nullable(),
    tracesLogin: z.string().optional().nullable(),
    tracesPassword: z.string().optional().nullable(),
    pfLogin: z.string().optional().nullable(),
    pfPassword: z.string().optional().nullable(),
    esiLogin: z.string().optional().nullable(),
    esiPassword: z.string().optional().nullable(),
    ptLogin: z.string().optional().nullable(),
    ptPassword: z.string().optional().nullable(),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        
        // Convert empty strings to null for URL validation
        if (body.gDriveLink === "") body.gDriveLink = null;

        const validation = onboardSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ 
                error: "Validation failed", 
                details: validation.error.format() 
            }, { status: 400 });
        }

        const data = validation.data;

        // Create the client
        const client = await prisma.client.create({
            data: {
                name: data.name,
                entityType: data.entityType,
                gstCategory: 'MONTHLY', // Default for now
                gstin: data.gstin || null,
                pan: data.pan || null,
                tan: data.tan || null,
                contactEmail: data.contactEmail || null,
                contactPhone: data.contactPhone || null,
                contactPerson: data.contactPerson || null,
                gDriveLink: data.gDriveLink || null,
                
                // Encrypt passwords
                itxLogin: data.itxLogin || null,
                itxPassword: data.itxPassword ? encrypt(data.itxPassword) : null,
                gstLogin: data.gstLogin || null,
                gstPassword: data.gstPassword ? encrypt(data.gstPassword) : null,
                tracesLogin: data.tracesLogin || null,
                tracesPassword: data.tracesPassword ? encrypt(data.tracesPassword) : null,
                pfLogin: data.pfLogin || null,
                pfPassword: data.pfPassword ? encrypt(data.pfPassword) : null,
                esiLogin: data.esiLogin || null,
                esiPassword: data.esiPassword ? encrypt(data.esiPassword) : null,
                ptLogin: data.ptLogin || null,
                ptPassword: data.ptPassword ? encrypt(data.ptPassword) : null,
            }
        });

        // Add a task for the team to review the onboarding
        await prisma.task.create({
            data: {
                title: `Review Onboarding: ${client.name}`,
                taskType: 'OTHER',
                description: `A new client has completed the onboarding process. Please review their details and credentials.\n\nGoogle Drive Link: ${client.gDriveLink || 'Not provided'}`,
                status: 'PENDING',
                priority: 'high',
                frequency: 'ONCE',
                clientId: client.id,
                dueDate: new Date(),
            }
        });

        return NextResponse.json({ success: true, clientId: client.id }, { status: 201 });
    } catch (error) {
        console.error("[ONBOARD_POST_ERROR]", error);
        return NextResponse.json({ error: "Failed to submit onboarding details" }, { status: 500 });
    }
}
