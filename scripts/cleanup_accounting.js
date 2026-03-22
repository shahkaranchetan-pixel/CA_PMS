const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const deleted = await prisma.task.deleteMany({
        where: {
            taskType: 'ACCOUNTING',
            period: 'Mar-2026'
        }
    })
    console.log(`Deleted ${deleted.count} old accounting tasks.`)
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
