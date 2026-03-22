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
let uiFixes = 0;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Fix hardcoded rgba(255,255,255,0.XX) that break light theme
    content = content.replace(/rgba\(255,\s*255,\s*255,\s*0\.[0-2]\d?\)/g, 'var(--surface2)');
    content = content.replace(/rgba\(255,\s*255,\s*255,\s*0\.[3-9]\d?\)/g, 'var(--border)');
    // Occasional #fff used as text color
    content = content.replace(/color:\s*['"]#fff['"]/g, "color: 'var(--text)'");
    content = content.replace(/color:\s*['"]#FFFFFF['"]/g, "color: 'var(--text)'");

    // Wrap tables in .table-wrapper if not already wrapped
    // We'll search for <table className="tbl"> and </table>
    // but avoid duplicate wrapping if we run twice
    if (content.includes('<table className="tbl">') && !content.includes('<div className="table-wrapper">')) {
        content = content.replace(/<table className="tbl">/g, '<div className="table-wrapper">\n<table className="tbl">');
        content = content.replace(/<\/table>/g, '</table>\n</div>');
    }

    // Fix common empty states padding and typography
    content = content.replace(
        /textAlign: 'center', padding: '20px 0', color: 'var\(--muted\)', fontSize: '12px'/g,
        "textAlign: 'center', padding: '32px 0', color: 'var(--muted)', fontSize: '13px', fontStyle: 'italic'"
    );

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        uiFixes++;
        console.log(`UI Fixed: ${file}`);
    }
}

console.log(`Done. Fixed UI bugs in ${uiFixes} files.`);
