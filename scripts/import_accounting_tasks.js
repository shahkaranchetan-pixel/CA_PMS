const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const dotenv = require('dotenv');
dotenv.config();

const prisma = new PrismaClient();
const filePath = 'C:\\Development\\Sample\\task_management_updated.xlsx';

const PERIOD = "Mar-2026";

async function main() {
    const workbook = XLSX.readFile(filePath);
    const sheetNames = workbook.SheetNames.filter(name => name !== 'Statutory Compliance' && name !== 'Instructions');

    const clients = await prisma.client.findMany({ select: { id: true, name: true } });
    const users = await prisma.user.findMany({ select: { id: true, name: true } });

    console.log(`Processing ${sheetNames.length} client sheets...`);

    for (const sheetName of sheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (data.length < 5) continue; // Skip empty sheets

        // Extract Assigned to
        const assignedLine = String(data[1] || "");
        const assigneeName = assignedLine.split(":")[1]?.trim() || "";
        
        const client = clients.find(c => 
            c.name.toLowerCase() === sheetName.toLowerCase() || 
            c.name.toLowerCase().includes(sheetName.toLowerCase()) ||
            sheetName.toLowerCase().includes(c.name.toLowerCase().split(' ')[0]) // Match "Hex LLP" to "Hexmodel..."
        );
        const user = users.find(u => u.name.toLowerCase().includes(assigneeName.toLowerCase()));

        if (!client) {
            console.log(`[${sheetName}] Error: Client not found in database.`);
            continue;
        }

        console.log(`[${sheetName}] Creating tasks for ${client.name} (assigned to ${assigneeName})...`);

        // Find the data start (Header is usually at row 3 (L3))
        let headerIndex = -1;
        for (let i = 0; i < Math.min(data.length, 6); i++) {
            if (data[i] && (data[i].includes('Task Description') || data[i].includes('Task Checklist'))) {
                headerIndex = i;
                break;
            }
        }
        
        if (headerIndex === -1) headerIndex = 3; // Fallback
        
        const taskItems = data.slice(headerIndex + 1).filter(row => row && row[4] && row[4].length > 3);
        
        if (taskItems.length === 0) continue;

        // Create the Top-Level Task for Accounting
        // Actually, some sheets have different Categories (Weekly, 1st-15th).
        // I'll group them into one "Accounting Management" task with Activities as subtasks.
        
        const mainTask = await prisma.task.create({
            data: {
                title: `Monthly Accounting & Checklist - ${PERIOD}`,
                description: `Complete accounting and operational checklist tasks for ${client.name} for the month of ${PERIOD}.`,
                taskType: 'ACCOUNTING',
                status: 'PENDING',
                priority: 'medium',
                frequency: 'MONTHLY',
                period: PERIOD,
                clientId: client.id,
                dueDate: new Date(2026, 2, 31), // End of March
                activities: {
                    create: taskItems.map(row => ({
                        title: `${row[3] ? `(${row[3]}) ` : ''}${row[4]}`,
                        isCompleted: false
                    }))
                }
            }
        });

        // Assign the user
        if (user) {
            await prisma.taskAssignee.create({
                data: {
                    taskId: mainTask.id,
                    userId: user.id
                }
            });
        }

        console.log(`[${sheetName}] Created task "${mainTask.title}" with ${taskItems.length} subtasks.`);
    }

    console.log("Processing Statutory Compliance Sheet...");
    const statSheet = workbook.Sheets['Statutory Compliance'];
    if (statSheet) {
        const statData = XLSX.utils.sheet_to_json(statSheet, { header: 1 });
        // Assuming statData structure matches client/type mapping
        // We'll skip for now if too complex, or implement if simple.
        // Actually, let's just do the accounting tasks first as requested.
    }

    console.log("\nDone!");
}

main()
    .catch((e) => {
        console.error("Critical error:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
