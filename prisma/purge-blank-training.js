const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // Delete all modules with blank/short content (< 100 chars)
    const modules = await prisma.trainingModule.findMany({
        include: { materials: true }
    });

    let deleted = 0;
    for (const m of modules) {
        const hasBlankContent = m.materials.some(mat => mat.content && mat.content.length < 100);
        if (hasBlankContent) {
            // Delete materials first (cascade)
            await prisma.trainingMaterial.deleteMany({ where: { moduleId: m.id } });
            await prisma.trainingModule.delete({ where: { id: m.id } });
            console.log(`🗑️  Deleted: [${m.category}] ${m.title}`);
            deleted++;
        }
    }

    if (deleted === 0) {
        console.log('✅ No blank modules found. All content looks good!');
    } else {
        console.log(`\n✅ Done! Deleted ${deleted} blank module(s). Please regenerate them from the Training Academy.`);
    }
}

main().then(() => prisma.$disconnect()).catch(e => { console.error(e); prisma.$disconnect(); });
