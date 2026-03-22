const XLSX = require('xlsx');
const path = require('path');

const filePath = 'C:\\Development\\Sample\\clientwise_dashboard_ready (4).xlsx';

try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    // Header row is index 1
    const headerRow = data[1];
    headerRow.forEach((h, i) => {
        console.log(`Column ${i}: ${h}`);
    });
    
} catch (error) {
    console.error("Error reading file:", error.message);
}
