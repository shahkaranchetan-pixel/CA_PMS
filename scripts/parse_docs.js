const fs = require('fs');
const AdmZip = require('adm-zip');
const entries = ['c:/Development/Sample/KCS_Effectiveness_Suggestions.docx', 'c:/Development/Sample/KCS_TaskPro_Code_Review.docx'];

entries.forEach(file => {
    try {
        const buffer = fs.readFileSync(file);
        const zip = new AdmZip(buffer);
        const xml = zip.readAsText('word/document.xml');
        const text = xml.replace(/<[^>]+>/g, ' ');
        console.log('\n=============================================');
        console.log('--- ' + file.split('/').pop() + ' ---');
        console.log('=============================================\n');
        console.log(text);
    } catch(e) {
        console.error("Error reading file:", file, e);
    }
});
