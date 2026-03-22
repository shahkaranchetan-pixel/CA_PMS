const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("🗑️ Starting data cleanup...");

    try {
        // Delete task-related dependencies
        console.log("- Deleting Task Assignees...");
        await prisma.taskAssignee.deleteMany();

        console.log("- Deleting Task Logs...");
        await prisma.taskLog.deleteMany();

        console.log("- Deleting Activities...");
        await prisma.activity.deleteMany();

        // Handle subtasks by deleting them in order (or just twice if depth is small)
        // Prisma allows deleteMany for all tasks at once if they have no other dependencies.
        console.log("- Deleting all Tasks...");
        // Setting parentId to null first to avoid self-reference constraints if any
        await prisma.task.updateMany({ data: { parentId: null, blockedById: null } });
        await prisma.task.deleteMany();

        // Delete client-related dependencies
        console.log("- Deleting Client Vault Entries...");
        await prisma.clientVaultEntry.deleteMany();

        console.log("- Deleting Client Notes...");
        await prisma.clientNote.deleteMany();

        console.log("- Deleting Client Documents...");
        await prisma.clientDocument.deleteMany();

        console.log("- Deleting Vault Audit Logs...");
        await prisma.vaultAuditLog.deleteMany();

        console.log("- Deleting all Clients...");
        await prisma.client.deleteMany();

        console.log("\n✅ Cleanup complete! All clients and tasks have been removed.");
    } catch (error) {
        console.error("❌ Error during cleanup:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
