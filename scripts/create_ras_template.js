const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const prisma = new PrismaClient();

const filePath = 'C:\\Development\\Sample\\RAS.xlsx';

async function main() {
    console.log(`Reading template from ${filePath}...`);
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    // Extract template name from first row "Template Name — Ras Skillshare"
    const firstRow = data[0][0] || "Ras Skillshare";
    const templateName = firstRow.split('—').pop().trim();

    // Skip first 3 rows (Template Name, Assigned to, Headers)
    const taskRows = data.slice(3).filter(row => row && row[2]);

    console.log(`Creating Task Template for: ${templateName}...`);

    const template = await prisma.taskTemplate.create({
        data: {
            name: templateName,
            description: `Quarterly accounting tasks for ${templateName}`,
            items: {
                create: taskRows.map(row => ({
                    title: row[2], // Task Description
                    taskType: 'ACCOUNTING',
                    dueDayOffset: typeof row[3] === 'number' ? row[3] : 0, // Due Date
                    description: `Periodicity: ${row[4] || 'Quarterly'}`, // Periodicity
                    priority: 'medium'
                }))
            }
        },
        include: { items: true }
    });

    console.log(`Successfully created Template: ${template.name} with ${template.items.length} items.`);
}

main()
    .catch(e => {
        console.error("Failed to create template:", e);
        process.exit(1);
    })
    .finally(async () => await prisma.$disconnect());
