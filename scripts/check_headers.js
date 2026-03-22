const XLSX = require('xlsx');
const path = require('path');

const filePath = 'C:\\Development\\Sample\\clientwise_dashboard_ready (4).xlsx';

try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (data.length > 0) {
        console.log("Headers:", data[0]);
        console.log("Rows Sample:", data.slice(1, 3));
    } else {
        console.log("Empty sheet.");
    }
} catch (error) {
    console.error("Error reading file:", error.message);
}
