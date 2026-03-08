const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
    const email = "admin@taskdesk.com";

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        console.log("Admin user already exists:", existing.email);
        return;
    }

    const hashedPassword = await bcrypt.hash("admin123", 10);

    const admin = await prisma.user.create({
        data: {
            name: "Admin",
            email: email,
            password: hashedPassword,
            role: "ADMIN",
            dept: "Management",
            color: "#E8A020",
        },
    });

    console.log("Created admin user:", admin.email);
    console.log("Login with: admin@taskdesk.com / admin123");
}

main()
    .then(() => prisma.$disconnect())
    .catch((e) => {
        console.error(e);
        prisma.$disconnect();
        process.exit(1);
    });
