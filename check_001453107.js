const fs = require('fs');
const xml = fs.readFileSync('C:/Users/truee/ai-administrative-scrivener/Application_form/在留資格認定証明書/001453107_extracted/xl/workbook.xml', 'utf8');

const m = xml.match(/<definedName name="([^"]+)"[^>]*>([^<]+)<\/definedName>/g);
console.log('Defined names:', m ? m.length : 0);
if (m) {
    const listNames = m.filter(s => s.includes('_L')).map(s => s.match(/name="([^"]+)"/)[1]);
    console.log('List names:', listNames.join(', '));
}

const s = xml.match(/<sheet name="([^"]+)" sheetId="(\d+)"/g);
console.log('Sheets:', s ? s.join(', ') : 'None');
