const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const modules = await prisma.trainingModule.findMany({
        select: { id: true, title: true, category: true, materials: { select: { id: true, type: true, content: true } } }
    });
    modules.forEach(m => {
        const hasBlankContent = m.materials.some(mat => mat.content && mat.content.length < 100);
        console.log(`[${hasBlankContent ? '❌ BLANK' : '✅ OK   '}] ${m.category} | ${m.title} | ${m.id}`);
    });
}

main().then(() => prisma.$disconnect()).catch(e => { console.error(e); prisma.$disconnect(); });
