const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    const settings = {
        SMTP_HOST: 'smtp.gmail.com',
        SMTP_PORT: '587',
        SMTP_USER: 'info.cakcshah@gmail.com',
        SMTP_PASS: 'ahqxeauaicrqsxyu',
        EMAIL_FROM: 'KC Shah & Co <info.cakcshah@gmail.com>',
        FIRM_NAME: 'KC Shah & Co',
        REMINDER_DAYS_BEFORE: '3'
    };

    console.log("Configuring KCS TaskPro SMTP & Firm settings...");

    for (const [key, value] of Object.entries(settings)) {
        await prisma.systemSetting.upsert({
            where: { key },
            update: { value },
            create: { key, value }
        });
        console.log(`✅ Set ${key}`);
    }

    console.log("-----------------------------------------");
    console.log("Setup Complete! You can now send reminders.");
}

main()
    .then(() => prisma.$disconnect())
    .catch((e) => {
        console.error("Setup failed:", e.message);
        prisma.$disconnect();
        process.exit(1);
    });
