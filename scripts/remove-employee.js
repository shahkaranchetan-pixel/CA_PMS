require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    console.log("Starting employee removal and task reassignment process...");

    const daminiEmail = "daminidubey888@gmail.com";
    const ajayEmail = "ajayrc22@gmail.com";

    // 1. Find the users
    const damini = await prisma.user.findUnique({ where: { email: daminiEmail } });
    const ajay = await prisma.user.findUnique({ where: { email: ajayEmail } });

    if (!damini) {
        console.log("Damini Dubey not found in the database. She may have already been removed.");
        return;
    }
    if (!ajay) {
        console.log("Ajay Chavan not found in the database. Cannot reassign tasks.");
        return;
    }

    console.log(`Found Damini (ID: ${damini.id})`);
    console.log(`Found Ajay (ID: ${ajay.id})`);

    // 2. Find Damini's tasks
    const daminiAssignments = await prisma.taskAssignee.findMany({
        where: { userId: damini.id },
        include: { task: true }
    });

    console.log(`Damini is assigned to ${daminiAssignments.length} task(s).`);

    // 3. Reassign tasks to Ajay
    let reassignedCount = 0;
    for (const assignment of daminiAssignments) {
        // Check if Ajay is already assigned to this task
        const ajayExistingAssignment = await prisma.taskAssignee.findUnique({
            where: {
                taskId_userId: {
                    taskId: assignment.taskId,
                    userId: ajay.id
                }
            }
        });

        if (ajayExistingAssignment) {
            // Ajay is already assigned, just delete Damini's assignment to prevent duplicate
            await prisma.taskAssignee.delete({
                where: { id: assignment.id }
            });
        } else {
            // Reassign to Ajay
            await prisma.taskAssignee.update({
                where: { id: assignment.id },
                data: { userId: ajay.id }
            });
            reassignedCount++;
        }
    }
    console.log(`Successfully reassigned ${reassignedCount} task(s) to Ajay.`);

    // 4. Reassign any ClientNotes to Ajay (since deleting Damini would fail otherwise due to foreign key restriction)
    const notesUpdated = await prisma.clientNote.updateMany({
        where: { authorId: damini.id },
        data: { authorId: ajay.id }
    });
    if (notesUpdated.count > 0) {
        console.log(`Reassigned ${notesUpdated.count} client note(s) to Ajay.`);
    }

    // 5. Delete Damini's user record
    await prisma.user.delete({
        where: { id: damini.id }
    });

    console.log("Successfully removed Damini Dubey from the system.");
}

main()
    .then(() => prisma.$disconnect())
    .catch((e) => {
        console.error("Error:", e.message);
        prisma.$disconnect();
        process.exit(1);
    });
