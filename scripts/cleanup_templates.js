const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const deleted = await prisma.taskTemplate.deleteMany({
        where: {
            name: { contains: 'Accounting Template' }
        }
    })
    console.log(`Deleted ${deleted.count} accounting templates.`)
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
