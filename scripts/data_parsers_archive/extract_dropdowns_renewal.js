const fs = require('fs');
const path = require('path');

const dst = path.join('C:', 'Users', 'truee', 'ai-administrative-scrivener', 'Application_form', '在留期間更新', 'Book1_extracted');

// 1. Read external link XML
const extLinkPath = path.join(dst, 'xl', 'externalLinks', 'externalLink1.xml');
const extXml = fs.readFileSync(extLinkPath, 'utf8');

// Match sheet names
const sheetNames = {};
const sheetNamesMatch = extXml.match(/<sheetName val="([^"]+)"\/>/g);
if (sheetNamesMatch) {
    sheetNamesMatch.forEach((str, i) => {
        const val = str.match(/val="([^"]+)"/)[1];
        sheetNames[i.toString()] = val;
    });
}

// Match cell values
const cellValues = {};
const sheetDataSets = extXml.split('<sheetData');
sheetDataSets.shift(); // remove first part
for (const sd of sheetDataSets) {
    const sidMatch = sd.match(/sheetId="(\d+)"/);
    if (!sidMatch) continue;
    const sid = sidMatch[1];
    const sName = sheetNames[sid];
    if (!sName) continue;

    const rows = sd.split('<row');
    rows.shift();
    for (const row of rows) {
        const cells = row.split('<cell');
        cells.shift();
        for (const cell of cells) {
            const rMatch = cell.match(/r="([^"]+)"/);
            const vMatch = cell.match(/<v>([^<]+)<\/v>/);
            if (rMatch && vMatch) {
                const key = `${sName}!${rMatch[1]}`;
                cellValues[key] = vMatch[1];
            }
        }
    }
}

// 2. Read workbook.xml to get defined names
const wbPath = path.join(dst, 'xl', 'workbook.xml');
const wbXml = fs.readFileSync(wbPath, 'utf8');

const definedNamesMatches = wbXml.match(/<definedName name="([^"]+)"[^>]*>([^<]+)<\/definedName>/g);

const result = {};

if (definedNamesMatches) {
    for (const dn of definedNamesMatches) {
        const match = dn.match(/<definedName name="([^"]+)"[^>]*>([^<]+)<\/definedName>/);
        if (!match) continue;
        const name = match[1];
        let ref = match[2];

        // _L suffix for lists
        if (name.endsWith('_L')) {
            // ref looks like [1]マスタ!$J$3:$J$6 or [1]'マスタ'!$H$3:$H$326
            const rangeMatch = ref.match(/\[\d+\](.+?)!\$([A-Z]+)\$(\d+):\$([A-Z]+)\$(\d+)/);
            if (rangeMatch) {
                let sName = rangeMatch[1].replace(/^'/, '').replace(/'$/, '');
                const col = rangeMatch[2];
                const startRow = parseInt(rangeMatch[3], 10);
                const endRow = parseInt(rangeMatch[5], 10);

                const values = [];
                for (let r = startRow; r <= endRow; r++) {
                    const cellKey = `${sName}!${col}${r}`;
                    const val = cellValues[cellKey];
                    if (val !== undefined) {
                        values.push(val);
                    }
                }
                if (values.length > 0) {
                    result[name] = values;
                }
            } else {
                const singleMatch = ref.match(/\[\d+\](.+?)!\$([A-Z]+)\$(\d+)/);
                if (singleMatch) {
                    let sName = singleMatch[1].replace(/^'/, '').replace(/'$/, '');
                    const col = singleMatch[2];
                    const row = parseInt(singleMatch[3], 10);
                    const cellKey = `${sName}!${col}${row}`;
                    const val = cellValues[cellKey];
                    if (val !== undefined) {
                        result[name] = [val];
                    }
                }
            }
        }
    }
}

// Write JSON
const outPath = path.join(__dirname, 'dropdowns_renewal.json');
fs.writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf8');
console.log(`Extracted ${Object.keys(result).length} named ranges to ${outPath}`);
