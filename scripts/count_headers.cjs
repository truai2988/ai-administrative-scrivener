const fs = require('fs');

function countHeaders(file) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n').filter(l => l.trim().startsWith('"'));
  return lines.length;
}

console.log('specificHeaders count:', countHeaders('src/lib/csv/specificHeaders.ts'));
console.log('simultaneousHeaders count:', countHeaders('src/lib/csv/simultaneousHeaders.ts'));

// Also count basic headers in generateBasicCsv.ts
const basicContent = fs.readFileSync('src/lib/csv/generateBasicCsv.ts', 'utf8');
const headerMatch = basicContent.match(/const headers: string\[\] = \[([\s\S]*?)\];/);
if (headerMatch) {
  const headerLines = headerMatch[1].split('\n').filter(l => l.trim().startsWith("'"));
  console.log('basicCsv inline header lines:', headerLines.length);
}
