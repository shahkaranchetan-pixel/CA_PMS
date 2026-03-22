const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
    const oldEmail = "admin@taskdesk.com";
    const newEmail = "info.cakcshah@gmail.com";
    const newPassword = "Admin@121";

    console.log("Updating admin user...");

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updatedUser = await prisma.user.update({
        where: { email: oldEmail },
        data: {
            email: newEmail,
            password: hashedPassword,
            name: "KC Shah Admin"
        }
    });

    console.log("Successfully updated admin user!");
    console.log("New Email:", updatedUser.email);
    console.log("New Password: [REDACTED]");
}

main()
    .then(() => prisma.$disconnect())
    .catch((e) => {
        console.error("Failed to update admin:", e.message);
        prisma.$disconnect();
        process.exit(1);
    });
