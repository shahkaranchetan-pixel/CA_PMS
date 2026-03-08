import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

// GET documents for a client
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const docs = await prisma.clientDocument.findMany({
            where: { clientId: id },
            orderBy: { uploadedAt: 'desc' }
        });
        return NextResponse.json(docs);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
    }
}

// POST upload a document
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const category = formData.get("category") as string || "OTHER";
        const notes = formData.get("notes") as string || "";

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // Create uploads directory
        const uploadDir = path.join(process.cwd(), "public", "uploads", id);
        await mkdir(uploadDir, { recursive: true });

        // Save file
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const uniqueName = `${Date.now()}_${safeName}`;
        const filePath = path.join(uploadDir, uniqueName);
        await writeFile(filePath, buffer);

        // Save to DB
        const doc = await prisma.clientDocument.create({
            data: {
                clientId: id,
                category,
                fileName: file.name,
                filePath: `/uploads/${id}/${uniqueName}`,
                fileSize: buffer.length,
                mimeType: file.type || null,
                notes: notes || null,
            }
        });

        return NextResponse.json(doc, { status: 201 });
    } catch (error) {
        console.error("Document upload error:", error);
        return NextResponse.json({ error: "Failed to upload document" }, { status: 500 });
    }
}

// DELETE a document
export async function DELETE(request: Request) {
    try {
        const { docId } = await request.json();

        await prisma.clientDocument.delete({
            where: { id: docId }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
    }
}
