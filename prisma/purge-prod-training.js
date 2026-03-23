// Cleans blank training modules from the PRODUCTION Neon database
const { PrismaClient } = require('@prisma/client');

// Point directly to production DB
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: "postgresql://neondb_owner:npg_35NbiAYCKsoH@ep-round-shape-a17hlcum-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
        }
    }
});

async function main() {
    const modules = await prisma.trainingModule.findMany({
        include: { materials: true }
    });

    console.log(`Found ${modules.length} total training modules in production DB.`);

    let deleted = 0;
    for (const m of modules) {
        const hasBlankContent = m.materials.some(mat => mat.content && mat.content.length < 150);
        if (hasBlankContent || m.materials.length === 0) {
            await prisma.trainingMaterial.deleteMany({ where: { moduleId: m.id } });
            await prisma.trainingModule.delete({ where: { id: m.id } });
            console.log(`🗑️  Deleted: [${m.category}] ${m.title}`);
            deleted++;
        } else {
            console.log(`✅ OK: [${m.category}] ${m.title}`);
        }
    }

    console.log(`\nDone! Deleted ${deleted} blank module(s) from production.`);
}

main().then(() => prisma.$disconnect()).catch(e => { console.error(e); prisma.$disconnect(); });
