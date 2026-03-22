const XLSX = require('xlsx');
const path = require('path');

const fileName = process.argv[2] || 'Upload 1.xlsx';
const filePath = path.join('c:/Development/Sample/', fileName);
const workbook = XLSX.readFile(filePath);
const allData = {};
workbook.SheetNames.forEach(sheetName => {
    const worksheet = workbook.Sheets[sheetName];
    allData[sheetName] = XLSX.utils.sheet_to_json(worksheet);
});

console.log(JSON.stringify(allData, null, 2));
