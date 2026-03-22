const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const dotenv = require('dotenv');
dotenv.config();

const prisma = new PrismaClient();
const filePath = 'C:\\Development\\Sample\\Client List.xlsx';

async function main() {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    // Header row is index 0 (Entity Name, etc.)
    // Data starts at index 1
    const startRow = 1;
    
    let createdCount = 0;
    
    console.log(`Starting import from row ${startRow}...`);
    
    for (let i = startRow; i < data.length; i++) {
        const row = data[i];
        if (!row || !row[0]) continue; // Skip empty or missing entity name
        
        const name = String(row[0]).trim();
        const entityType = row[1] ? String(row[1]).trim() : "Proprietorship";
        const contactPerson = row[2] ? String(row[2]).trim() : null;
        const contactPhone = row[3] ? String(row[3]).trim() : null;
        const contactEmail = row[4] ? String(row[4]).trim() : null;
        
        const gstin = row[5] ? String(row[5]).trim() : null;
        const gstLogin = row[6] ? String(row[6]).trim() : null;
        const gstPassword = row[7] ? String(row[7]).trim() : null;

        try {
            const client = await prisma.client.create({
                data: {
                    name,
                    entityType,
                    contactPerson,
                    contactPhone,
                    contactEmail,
                    gstin,
                    gstLogin,
                    gstPassword,
                    active: true
                }
            });
            console.log(`[${i}] Created: ${client.name}`);
            createdCount++;
        } catch (error) {
            console.error(`[${i}] Failed to create ${name}:`, error.message);
        }
    }
    
    console.log(`\nImport Complete! Created ${createdCount} clients.`);
}

main()
    .catch((e) => {
        console.error("Critical Error during import:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
