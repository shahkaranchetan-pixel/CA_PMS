const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const search = ["Action", "Hex", "Swiss", "Maxim", "Alpha", "Jain", "AG17", "Ras", "Gautam"];
    const clients = await prisma.client.findMany({
        where: {
            OR: search.map(s => ({ name: { contains: s, mode: 'insensitive' } }))
        },
        select: { id: true, name: true }
    })
    console.log(JSON.stringify(clients, null, 2))
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
