/**
 * One-time cleanup script: Soft-delete all overdue tasks.
 * 
 * Definition: A task is "overdue" if:
 *   - dueDate is before today
 *   - status is PENDING or IN_PROGRESS
 *   - deletedAt is null (not already deleted)
 * 
 * Also soft-deletes child subtasks of any deleted task.
 * 
 * Usage: node scripts/delete-overdue-tasks.js
 */

require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
    const now = new Date();
    console.log(`\n🗑️  KCS TaskPro — Overdue Task Cleanup`);
    console.log(`📅 Running at: ${now.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST`);
    console.log(`─────────────────────────────────────────`);

    // Find all overdue parent tasks (not subtasks — parentId is null)
    const overdueTasks = await prisma.task.findMany({
        where: {
            deletedAt: null,
            status: { in: ["PENDING", "IN_PROGRESS"] },
            dueDate: { lt: now },
        },
        select: {
            id: true,
            title: true,
            taskType: true,
            dueDate: true,
            status: true,
            client: { select: { name: true } },
        },
        orderBy: { dueDate: "asc" },
    });

    if (overdueTasks.length === 0) {
        console.log("✅ No overdue tasks found. Database is clean!");
        return;
    }

    console.log(`\n⚠️  Found ${overdueTasks.length} overdue task(s):\n`);
    overdueTasks.forEach((t) => {
        const due = t.dueDate ? t.dueDate.toLocaleDateString("en-IN") : "No due date";
        console.log(`  • [${t.status}] ${t.title} — ${t.client?.name || "Unknown"} (Due: ${due})`);
    });

    const overdueIds = overdueTasks.map((t) => t.id);
    const deletedAt = now;

    // Soft-delete subtasks of overdue tasks first
    const subtaskResult = await prisma.task.updateMany({
        where: {
            parentId: { in: overdueIds },
            deletedAt: null,
        },
        data: { deletedAt },
    });

    // Soft-delete the overdue tasks themselves
    const taskResult = await prisma.task.updateMany({
        where: { id: { in: overdueIds } },
        data: { deletedAt },
    });

    console.log(`\n✅ Deleted ${taskResult.count} overdue task(s)`);
    if (subtaskResult.count > 0) {
        console.log(`✅ Deleted ${subtaskResult.count} associated subtask(s)`);
    }
    console.log(`\n🎉 Database cleaned. Fresh start ready!\n`);
}

main()
    .then(() => prisma.$disconnect())
    .catch((e) => {
        console.error("\n❌ Error:", e.message);
        prisma.$disconnect();
        process.exit(1);
    });
