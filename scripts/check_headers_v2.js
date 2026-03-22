const XLSX = require('xlsx');
const path = require('path');

const filePath = 'C:\\Development\\Sample\\clientwise_dashboard_ready (4).xlsx';

try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    // Find the header row (it should be the one starting with S.No)
    let headerRowIndex = -1;
    for (let i = 0; i < data.length; i++) {
        if (data[i] && data[i].includes('S.No')) {
            headerRowIndex = i;
            break;
        }
    }
    
    if (headerRowIndex !== -1) {
        console.log("Header row found at index:", headerRowIndex);
        console.log("Headers:", data[headerRowIndex]);
        console.log("Sample Data Row:", data[headerRowIndex + 1]);
    } else {
        console.log("Could not find S.No header.");
    }
} catch (error) {
    console.error("Error reading file:", error.message);
}
