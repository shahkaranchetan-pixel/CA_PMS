const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const employees = [
    { name: 'Suraj Sahani', email: 'suraj97737@gmail.com', phone: '9773705416', passwordStr: 'suraj@123' },
    { name: 'Preksha Shah', email: 'ps1282002@gmail.com', phone: '7021080353', passwordStr: 'preksha@123' },
    { name: 'Drashti Shah', email: 'drashti@kcshah.com', phone: '9224758234', passwordStr: 'drashti@123' },
    { name: 'Bhoomi Bhukan', email: 'bhoomibhukan@gmail.com', phone: '8898902106', passwordStr: 'bhoomi@123' },
    { name: 'Krishna Vitthalani', email: 'krishnayvithalani@gmail.com', phone: '9511789745', passwordStr: 'krishna@123' },
    { name: 'Ajay Chavan', email: 'ajayrc22@gmail.com', phone: '7715915044', passwordStr: 'ajay@123' },
    { name: 'Chandiran Maharajan', email: 'chandu@kcshah.com', phone: '8286546262', passwordStr: 'chandiran@123' },
    { name: 'Damini Dubey', email: 'daminidubey888@gmail.com', phone: '9930349109', passwordStr: 'damini@2h3' },
    { name: 'Hetvi Shah', email: 'hetvi@kcshah.com', phone: '8080626445', passwordStr: 'hetvi@123' }
];

async function main() {
    console.log('Starting to seed employees...');

    for (const emp of employees) {
        const existing = await prisma.user.findUnique({ where: { email: emp.email } });
        if (existing) {
            console.log(`User ${emp.email} already exists. Skipping.`);
            continue;
        }

        const hashedPassword = await bcrypt.hash(emp.passwordStr, 10);

        await prisma.user.create({
            data: {
                name: emp.name,
                email: emp.email,
                phone: emp.phone,
                password: hashedPassword,
                role: "EMPLOYEE"
            }
        });
        console.log(`Created user: ${emp.name} (${emp.email})`);
    }

    console.log('Done!');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
