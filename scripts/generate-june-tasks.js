/**
 * One-time script: Generate all statutory tasks for June 2026 for all active clients.
 * 
 * Tasks generated per client (based on their profile):
 *   - GSTR-1 Filing       (if GSTIN present, MONTHLY)   → Due June 11
 *   - GSTR-3B Filing      (if GSTIN present)             → Due June 20
 *   - TDS Payment         (if TAN present)               → Due June 7
 *   - PF/ESI/PT           (if PF/ESI/PT login present)  → Due June 15
 *   - Monthly Accounting  (always)                       → Due June 30
 * 
 * Skips any task that already exists for that client + taskType + period.
 * 
 * Usage: node scripts/generate-june-tasks.js
 */

require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const PERIOD = "Jun-2026";
const YEAR = 2026;
const MONTH = 5; // 0-indexed: June = 5

async function main() {
    console.log(`\n📅 KCS TaskPro — Task Generator`);
    console.log(`📆 Generating tasks for: ${PERIOD}`);
    console.log(`─────────────────────────────────────────`);

    const clients = await prisma.client.findMany({
        where: { deletedAt: null, active: true },
    });

    console.log(`👥 Found ${clients.length} active client(s)\n`);

    let created = 0;
    let skipped = 0;

    for (const client of clients) {
        const tasksToCreate = [];

        // 1. GST Tasks (if GSTIN present)
        if (client.gstin) {
            if (client.gstCategory === "MONTHLY" || !client.gstCategory) {
                tasksToCreate.push({
                    title: `GSTR-1 Filing - ${PERIOD}`,
                    taskType: "GST_1",
                    dueDay: 11,
                });
            }
            tasksToCreate.push({
                title: `GSTR-3B Filing - ${PERIOD}`,
                taskType: "GSTR_3B",
                dueDay: 20,
            });
        }

        // 2. TDS Payment (if TAN present)
        if (client.tan) {
            tasksToCreate.push({
                title: `TDS Payment - ${PERIOD}`,
                taskType: "TDS_PAYMENT",
                dueDay: 7,
            });
        }

        // 3. PF/ESI/PT (if any payroll portal credentials exist)
        if (client.pfLogin || client.esiLogin || client.ptLogin) {
            tasksToCreate.push({
                title: `PF/ESI/PT - ${PERIOD}`,
                taskType: "PF_ESI_PT",
                dueDay: 15,
            });
        }

        // 4. Monthly Accounting (always for active clients)
        tasksToCreate.push({
            title: `Monthly Accounting - ${PERIOD}`,
            taskType: "ACCOUNTING",
            dueDay: 30,
        });

        // Create each task if it doesn't already exist
        for (const t of tasksToCreate) {
            const existing = await prisma.task.findFirst({
                where: {
                    clientId: client.id,
                    taskType: t.taskType,
                    period: PERIOD,
                    deletedAt: null,
                },
            });

            if (existing) {
                skipped++;
                continue;
            }

            let dueDate = new Date(YEAR, MONTH, t.dueDay);
            // Handle month overflow (e.g. Feb 30 → Mar 2)
            if (dueDate.getMonth() !== MONTH) {
                dueDate = new Date(YEAR, MONTH + 1, 0); // last day of June
            }

            await prisma.task.create({
                data: {
                    title: t.title,
                    taskType: t.taskType,
                    description: `Auto-generated statutory task for ${PERIOD}`,
                    status: "PENDING",
                    frequency: "MONTHLY",
                    dueDate,
                    period: PERIOD,
                    clientId: client.id,
                },
            });

            created++;
        }
    }

    console.log(`✅ Created : ${created} task(s)`);
    if (skipped > 0) console.log(`⏭️  Skipped : ${skipped} (already existed)`);
    console.log(`\n🎉 June 2026 tasks are ready!\n`);
}

main()
    .then(() => prisma.$disconnect())
    .catch((e) => {
        console.error("\n❌ Error:", e.message);
        prisma.$disconnect();
        process.exit(1);
    });
