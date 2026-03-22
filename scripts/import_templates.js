const { PrismaClient } = require('@prisma/client')
const XLSX = require('xlsx')
const prisma = new PrismaClient()

const filePath = 'C:\\Development\\Sample\\task_management_updated.xlsx'

async function main() {
    const workbook = XLSX.readFile(filePath)
    const sheetNames = workbook.SheetNames.filter(name => name !== 'Statutory Compliance' && name !== 'Instructions')

    console.log(`Creating reusable templates for ${sheetNames.length} clients...`)

    for (const sheetName of sheetNames) {
        const worksheet = workbook.Sheets[sheetName]
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
        
        // Find header row starting with Task Checklist
        let headerIndex = -1;
        for (let i = 0; i < Math.min(data.length, 6); i++) {
            if (data[i] && (data[i].includes('Task Description') || data[i].includes('Task Checklist'))) {
                headerIndex = i;
                break;
            }
        }
        if (headerIndex === -1) headerIndex = 3;
        
        const taskItems = data.slice(headerIndex + 1).filter(row => row && row[4] && row[4].length > 3)

        if (taskItems.length === 0) continue

        // Create Task Template
        const template = await prisma.taskTemplate.create({
            data: {
                name: `${sheetName} Accounting Template`,
                description: `Default accounting checklist for ${sheetName}`,
                items: {
                    create: taskItems.map(row => ({
                        title: row[4],
                        taskType: 'ACCOUNTING',
                        description: row[3] || '',
                        priority: 'medium'
                    }))
                }
            }
        })
        console.log(`Created Template: ${template.name}`)
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
