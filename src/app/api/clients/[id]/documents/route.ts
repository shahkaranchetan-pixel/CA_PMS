import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

/**
 * FILE STORAGE — LOCAL (current)
 * Files are written to public/uploads/ on the server filesystem.
 *
 * ⚠️  VERCEL / SERVERLESS WARNING:
 *   The Vercel filesystem is ephemeral — files written here will be LOST
 *   on the next deployment or cold-start. This is fine for local dev.
 *
 * TODO — UPGRADE PATH (when you have credentials):
 *   1. npm install @aws-sdk/client-s3   (for AWS S3)
 *      — OR —
 *      npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner  (for Cloudflare R2)
 *   2. Add to .env:
 *        STORAGE_PROVIDER=s3          # or r2
 *        S3_BUCKET=your-bucket-name
 *        S3_REGION=ap-south-1
 *        S3_ACCESS_KEY_ID=...
 *        S3_SECRET_ACCESS_KEY=...
 *        S3_ENDPOINT=https://...      # R2 only
 *   3. Replace the writeFile block below with an S3 PutObjectCommand.
 *   4. Replace filePath in the DB with the S3/R2 public URL.
 */

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export const dynamic = "force-dynamic";

// GET documents for a client
export async function GET(request: Request, { params }: any) {
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
export async function POST(request: Request, { params }: any) {
    try {
        const { id } = await params;
        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const category = formData.get("category") as string || "OTHER";
        const notes = formData.get("notes") as string || "";

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        if (file.size > MAX_FILE_SIZE_BYTES) {
            return NextResponse.json(
                { error: `File too large. Maximum allowed size is 10 MB (received ${(file.size / 1048576).toFixed(1)} MB).` },
                { status: 413 }
            );
        }

        // Warn in production if using ephemeral local storage on Vercel
        if (process.env.VERCEL && !process.env.STORAGE_PROVIDER) {
            console.warn(
                "[documents] ⚠️  Writing to local filesystem on Vercel — files will be lost on next deployment. "
                + "Configure STORAGE_PROVIDER=s3 (or r2) to use persistent cloud storage."
            );
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
