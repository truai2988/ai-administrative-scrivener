const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const EXCEL_FILE = path.join(__dirname, 'Application_form', '在留資格認定証明書', '001453107.xlsm');
console.log('Loading workbook...');
const workbook = XLSX.readFile(EXCEL_FILE, { cellNF: false, cellDates: true });

console.log('Workbook loaded. Extracting named ranges...');
const names = workbook.Workbook.Names;
const result = {};

if (names) {
    for (const namedRange of names) {
        const name = namedRange.Name;
        const ref = namedRange.Ref;
        
        // _L suffix indicates a list, but we can grab others if needed.
        // Also grab everything to check if city lists are there.
        if (ref) {
            const match = ref.match(/^'?([^'!]+)'?!\$?([A-Z]+)\$(\d+):\$?([A-Z]+)\$(\d+)$/);
            if (match) {
                const sheetName = match[1];
                const startCol = match[2];
                const startRow = parseInt(match[3], 10);
                const endCol = match[4];
                const endRow = parseInt(match[5], 10);
                
                const sheet = workbook.Sheets[sheetName];
                if (sheet) {
                    const values = [];
                    // Assuming lists are usually in a single column
                    if (startCol === endCol) {
                        for (let r = startRow; r <= endRow; r++) {
                            const cellAddress = startCol + r;
                            const cell = sheet[cellAddress];
                            if (cell && cell.v !== undefined && cell.v !== '') {
                                values.push(cell.w ? cell.w : cell.v.toString());
                            }
                        }
                    }
                    if (values.length > 0) {
                        result[name] = values;
                    }
                }
            } else {
                // single cell ref
                const singleMatch = ref.match(/^'?([^'!]+)'?!\$?([A-Z]+)\$(\d+)$/);
                if (singleMatch) {
                    const sheetName = singleMatch[1];
                    const col = singleMatch[2];
                    const row = parseInt(singleMatch[3], 10);
                    const sheet = workbook.Sheets[sheetName];
                    if (sheet) {
                        const cell = sheet[col + row];
                        if (cell && cell.v !== undefined && cell.v !== '') {
                            result[name] = [cell.w ? cell.w : cell.v.toString()];
                        }
                    }
                }
            }
        }
    }
}

const outPath = path.join(__dirname, 'src', 'lib', 'constants', 'dropdowns_001453107.json');
fs.writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf8');
console.log(`Extracted ${Object.keys(result).length} named ranges to ${outPath}`);
