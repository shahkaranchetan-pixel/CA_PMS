const fs = require('fs');
const PDFParser = require('pdf2json');
const path = require('path');

const files = [
    'c:/Development/Sample/KCS_Effectiveness_Suggestions.pdf', 
    'c:/Development/Sample/KCS_TaskPro_Code_Review.pdf'
];

let allText = '';
let processed = 0;

files.forEach(file => {
    const pdfParser = new PDFParser(this, 1);
    
    pdfParser.on("pdfParser_dataError", errData => console.error(`Error reading ${file}:`, errData.parserError));
    pdfParser.on("pdfParser_dataReady", pdfData => {
        allText += '\n=============================================\n';
        allText += '--- ' + file.split('/').pop() + ' ---\n';
        allText += '=============================================\n\n';
        allText += pdfParser.getRawTextContent();
        
        processed++;
        if (processed === files.length) {
            fs.writeFileSync('c:/Development/ca-practice/scripts/pdf_dump.txt', allText);
            console.log('Done writing pdf_dump.txt');
        }
    });
    
    pdfParser.loadPDF(file);
});
