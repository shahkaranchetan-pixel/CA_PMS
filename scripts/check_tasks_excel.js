const XLSX = require('xlsx');
const path = require('path');

const filePath = 'C:\\Development\\Sample\\task_management_updated.xlsx';

try {
    const workbook = XLSX.readFile(filePath);
    const sheetNames = workbook.SheetNames;
    console.log("Sheet names:", sheetNames);
    
    sheetNames.forEach(name => {
        const worksheet = workbook.Sheets[name];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        if (data.length > 0) {
            console.log(`\nSheet: ${name}`);
            console.log("Headers:", data[0]);
            console.log("Rows Sample:", data.slice(1, 3));
        }
    });
} catch (error) {
    console.error("Error reading file:", error.message);
}
