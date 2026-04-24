import fs from 'fs';

function parseCsvLine(line) {
  const cols = [];
  let inQ = false, cur = '';
  for (const c of line) {
    if (c === '"') { inQ = !inQ; }
    else if (c === ',' && !inQ) { cols.push(cur); cur = ''; }
    else { cur += c; }
  }
  cols.push(cur);
  return cols;
}

const vPath = 'Application_form/在留資格認定証明書/申請情報入力(区分V).csv';
const vContent = fs.readFileSync(vPath, 'utf8');
const vLines = vContent.split('\r\n').filter(l => l.length > 0);
const vHeaders = parseCsvLine(vLines[0]);

// Print 0-63
for (let i = 0; i <= 63; i++) {
  const firstLine = vHeaders[i].split('\n')[0].trim();
  console.log(`  [${String(i).padStart(3)}] ${firstLine.substring(0, 120)}`);
}
