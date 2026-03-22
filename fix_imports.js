const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(fullPath));
        } else {
            if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
                results.push(fullPath);
            }
        }
    });
    return results;
}

const files = walk('./src');
let modifiedCount = 0;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    const regex = /import\s*\{\s*authOptions\s*\}\s*from\s*['"].*?\[\.\.\.nextauth\]\/route['"];?/g;
    
    if (regex.test(content)) {
        const newContent = content.replace(regex, 'import { authOptions } from "@/lib/auth-options";');
        fs.writeFileSync(file, newContent, 'utf8');
        modifiedCount++;
        console.log(`Updated: ${file}`);
    }
}

console.log(`Done. Updated ${modifiedCount} files.`);
