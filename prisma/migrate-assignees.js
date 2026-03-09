// Migration script: 
// 1. Create TaskAssignee junction table
// 2. Copy existing assigneeId data into it
// 3. After this, run `prisma db push` to drop assigneeId and sync schema

const { PrismaClient } = require('@prisma/client');

async function main() {
    const prisma = new PrismaClient();

    try {
        // Step 1: Create the TaskAssignee table if it doesn't exist
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "TaskAssignee" (
                "id" TEXT NOT NULL,
                "taskId" TEXT NOT NULL,
                "userId" TEXT NOT NULL,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "TaskAssignee_pkey" PRIMARY KEY ("id"),
                CONSTRAINT "TaskAssignee_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT "TaskAssignee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
            )
        `);
        console.log('TaskAssignee table created/verified.');

        // Add unique constraint
        await prisma.$executeRawUnsafe(`
            CREATE UNIQUE INDEX IF NOT EXISTS "TaskAssignee_taskId_userId_key" ON "TaskAssignee"("taskId", "userId")
        `);
        console.log('Unique index created/verified.');

        // Step 2: Check if assigneeId column exists and migrate data
        const hasColumn = await prisma.$queryRawUnsafe(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'Task' AND column_name = 'assigneeId'
        `);

        if (Array.isArray(hasColumn) && hasColumn.length > 0) {
            const result = await prisma.$executeRawUnsafe(`
                INSERT INTO "TaskAssignee" ("id", "taskId", "userId", "createdAt")
                SELECT gen_random_uuid()::text, "id", "assigneeId", NOW()
                FROM "Task"
                WHERE "assigneeId" IS NOT NULL
                ON CONFLICT ("taskId", "userId") DO NOTHING
            `);
            console.log('Migrated ' + result + ' existing task assignments to TaskAssignee table.');
        } else {
            console.log('assigneeId column already removed, skipping data migration.');
        }

        console.log('Migration complete! Now run: prisma db push');
    } catch (error) {
        console.error('Migration error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
