const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const templates = [
        {
            name: "ADS LLP - Monthly Checklist",
            description: "Task Checklist — Action Data Systems India LLP",
            items: [
                { title: "Download Bank statement", dueDayOffset: 2 },
                { title: "Change narration in Import file", dueDayOffset: 3 },
                { title: "Import statement in Tally", dueDayOffset: 3 },
                { title: "Clear all Bank entries", dueDayOffset: 3 },
                { title: "Clear all BOB entries", dueDayOffset: 3 },
                { title: "For suspense entries ask Indira madam", dueDayOffset: 6 },
                { title: "Record Salaries entries in Books", dueDayOffset: 9 },
                { title: "Share MIS Report", dueDayOffset: 10 },
            ]
        },
        {
            name: "LNI - Monthly Checklist",
            description: "Task Checklist — LNI Gas Generators Private Limited",
            items: [
                { title: "Revenue MIS", dueDayOffset: 2 },
                { title: "Monthly Salary Sheet for PF", dueDayOffset: 7 },
                { title: "Monthly MIS", dueDayOffset: 20 },
            ]
        },
        {
            name: "Hex LLP - Monthly Checklist",
            description: "Task Checklist — Hexmodel Technologies India LLP",
            items: [
                { title: "Coordinate with Edwin Sir for monthly invoices", dueDayOffset: 1 },
                { title: "Check Action Data System emails for invoices", dueDayOffset: 1 },
                { title: "Resolve invoice queries with Edwin Sir", dueDayOffset: 1 },
                { title: "Review & approve invoices with checklist", dueDayOffset: 1 },
                { title: "Prepare FX Gain/Loss Sheet", dueDayOffset: 10 },
                { title: "Prepare Export Costing for every export", dueDayOffset: 10 },
                { title: "Check Odoo – Quantity received by Hex USA", dueDayOffset: 10 },
                { title: "Update Advances Reconciliation Sheet", dueDayOffset: 10 },
                { title: "Update Detailed Remittance Sheet", dueDayOffset: 10 },
                { title: "Prepare MIS (P&L & Balance Sheet)", dueDayOffset: 10 },
                { title: "Email MIS to Snehal", dueDayOffset: 10 },
                { title: "Upload Export & Import invoices", dueDayOffset: 10 },
            ]
        },
        {
            name: "Hex LLP - Weekly Checklist",
            description: "Task Checklist — Hexmodel Technologies India LLP- Weekly",
            items: [
                { title: "Update Bank Statements & Invoices", dueDayOffset: 1 },
                { title: "Create E-Way Bill for Job Workers", dueDayOffset: 1 },
                { title: "Record Material In/Out & review stock", dueDayOffset: 1 },
                { title: "GST Refund status mail", dueDayOffset: 1 },
                { title: "Update Hex Remitance Sheet", dueDayOffset: 1 },
            ]
        },
        {
            name: "AG17 - Monthly Checklist",
            description: "Template — AG17 Trading India LLP",
            items: [
                { title: "Receipt of Bank Statements and Invoices", dueDayOffset: 1 },
                { title: "Sharing suspense entries and queries", dueDayOffset: 5 },
                { title: "Response of suspense entries and queries", dueDayOffset: 7 },
                { title: "Accounts maintaining and monthly finalization", dueDayOffset: 10 },
            ]
        }
    ];

    for (const t of templates) {
        const created = await prisma.taskTemplate.create({
            data: {
                name: t.name,
                description: t.description,
                items: {
                    create: t.items.map(item => ({
                        title: item.title,
                        taskType: "ACCOUNTING",
                        dueDayOffset: item.dueDayOffset,
                        priority: "medium"
                    }))
                }
            }
        });
        console.log(`Created template: ${created.name}`);
    }
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
