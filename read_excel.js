/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */
const ExcelJS = require('exceljs');

async function main() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile('Application_form/在留期間更新/在留期間更新許可申請書.xlsx');

    workbook.eachSheet(function(worksheet, sheetId) {
        console.log(`\n\n--- Sheet: ${worksheet.name} ---`);
        worksheet.eachRow(function(row, rowNumber) {
            let rowData = [];
            row.eachCell(function(cell, colNumber) {
                if (cell.value) {
                    rowData.push(`[${rowNumber},${colNumber}]: ${String(cell.value).replace(/\s+/g, ' ')}`);
                }
            });
            if (rowData.length > 0) {
                console.log(rowData.join(' | '));
            }
        });
    });
}

main().catch(console.error);
/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */

