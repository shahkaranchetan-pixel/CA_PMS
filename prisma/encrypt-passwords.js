const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

// Local copy of encryption logic since this is a separate script
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const ENCODING = 'hex';

function encrypt(text, keyBuf) {
    if (!text || text.includes(':')) return text; // Skip empty or already encrypted
    
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, keyBuf, iv);
    
    let encrypted = cipher.update(text, 'utf8', ENCODING);
    encrypted += cipher.final(ENCODING);
    
    const tag = cipher.getAuthTag();
    return `${iv.toString(ENCODING)}:${tag.toString(ENCODING)}:${encrypted}`;
}

async function migrate() {
    const key = process.env.VAULT_ENCRYPTION_KEY;
    if (!key) {
        console.error('ERROR: VAULT_ENCRYPTION_KEY must be set in your environment variables.');
        process.exit(1);
    }
    const keyBuf = Buffer.from(key, 'hex');

    console.log('--- Starting Encryption Migration ---');

    // 1. Migrate Clients
    const clients = await prisma.client.findMany();
    console.log(`Found ${clients.length} clients to check.`);

    for (const client of clients) {
        const updateData = {};
        const passwordFields = ['itxPassword', 'gstPassword', 'tracesPassword', 'pfPassword', 'esiPassword', 'ptPassword'];
        
        let changed = false;
        for (const field of passwordFields) {
            if (client[field] && !client[field].includes(':')) {
                updateData[field] = encrypt(client[field], keyBuf);
                changed = true;
            }
        }

        if (changed) {
            await prisma.client.update({
                where: { id: client.id },
                data: updateData
            });
            console.log(`  Encrypted passwords for client: ${client.name}`);
        }
    }

    // 2. Migrate Vault Entries
    const entries = await prisma.clientVaultEntry.findMany();
    console.log(`Found ${entries.length} vault entries to check.`);

    for (const entry of entries) {
        if (entry.password && !entry.password.includes(':')) {
            await prisma.clientVaultEntry.update({
                where: { id: entry.id },
                data: { password: encrypt(entry.password, keyBuf) }
            });
            console.log(`  Encrypted password for vault entry: ${entry.portalName}`);
        }
    }

    console.log('--- Migration Complete ---');
}

migrate()
    .catch(err => {
        console.error('Migration failed:', err);
    })
    .finally(() => {
        prisma.$disconnect();
    });
