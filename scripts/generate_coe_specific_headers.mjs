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

// Extract only the logical name (first line of each header)
const headerNames = vHeaders.map(h => {
  const firstLine = h.split('\n')[0].trim();
  return firstLine;
});

// Generate TypeScript export
let ts = `/**\n * COE 申請情報入力(区分V).csv のヘッダー定義\n * 全${headerNames.length}項目（インデックス 0〜${headerNames.length - 1}）\n * \n * ※ このファイルはスクリプトにより自動生成されています。手動編集しないでください。\n */\nexport const COE_SPECIFIC_HEADERS: string[] = [\n`;

headerNames.forEach((h, i) => {
  const escaped = h.replace(/'/g, "\\'");
  const comma = i < headerNames.length - 1 ? ',' : '';
  ts += `  '${escaped}'${comma} // [${i}]\n`;
});

ts += '];\n';

fs.writeFileSync('src/lib/csv/coe/coeSpecificHeaders.ts', ts, 'utf8');
console.log(`Generated coeSpecificHeaders.ts with ${headerNames.length} headers.`);
