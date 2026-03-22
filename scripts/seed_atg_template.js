const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const templateData = {
        name: "Action Tour Guide LLC - Monthly Checklist",
        description: "Task Checklist — Action Tour Guide LLC",
        items: [
            { title: "Download Bank & Credit card statements", dueDayOffset: 1 },
            { title: "Mail Falguni ma'am for TD, Amex, Fidelity, BoA", dueDayOffset: 1 },
            { title: "Share B2B Payments received with Nishant Sir", dueDayOffset: 1 },
            { title: "Create Vendor invoices from ATG Mail", dueDayOffset: 1 },
            { title: "Create BtoB invoices and mail to Nishant Sir", dueDayOffset: 1 },
            { title: "Share Credit card Conso File to managers", dueDayOffset: 3 },
            { title: "Create B2C Invoices from Apple Sales Sheet", dueDayOffset: 3 },
            { title: "Import Bank in QB - Clear entries", dueDayOffset: 3 },
            { title: "Share Sales summary sheet with Managers", dueDayOffset: 7 },
            { title: "Share Suspense entries to Managers/Falguni mam", dueDayOffset: 7 },
            { title: "Clear Credit card entries", dueDayOffset: 10 },
            { title: "Reconcile Credit card & Bank in QB", dueDayOffset: 10 },
            { title: "Add remarks in Reports (if change > 5%)", dueDayOffset: 10 },
            { title: "Add Payments date in AP/AR reports", dueDayOffset: 10 },
            { title: "Interest Calculation on Loan from directors", dueDayOffset: 10 },
            { title: "Share MIS Report", dueDayOffset: 15 },
        ]
    };

    const created = await prisma.taskTemplate.create({
        data: {
            name: templateData.name,
            description: templateData.description,
            items: {
                create: templateData.items.map(item => ({
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

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
