const XLSX = require('xlsx');
const path = require('path');

const filePath = 'C:\\Development\\Sample\\task_management_updated.xlsx';

try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = "Statutory Compliance";
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    console.log(`\nSheet: ${sheetName}`);
    data.slice(0, 10).forEach((row, i) => {
        console.log(`L${i}:`, JSON.stringify(row));
    });
} catch (error) {
    console.error("Error reading file:", error.message);
}
