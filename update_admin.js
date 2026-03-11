const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function main() {
    const hashedPassword = await bcrypt.hash("admin123", 10)
    await prisma.user.update({
        where: { email: "admin@taskdesk.com" },
        data: { password: hashedPassword }
    })
    console.log("Admin password updated to 'admin123'")
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
