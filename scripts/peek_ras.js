const XLSX = require('xlsx');
const path = require('path');

const filePath = 'C:\\Development\\Sample\\RAS.xlsx';

try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    console.log(JSON.stringify(data, null, 2));
} catch (error) {
    console.error("Error reading file:", error.message);
}
