const fs = require('fs');
const xml = fs.readFileSync('C:/Users/truee/ai-administrative-scrivener/Application_form/在留資格認定証明書/Book7_extracted/xl/workbook.xml', 'utf8');
const matches = xml.match(/<definedName name="([^"]+)"/g);
if (matches) {
  const names = matches.map(s => s.replace('<definedName name="', '').replace('"', ''));
  console.log(names.join(', '));
} else {
  console.log('No defined names found.');
}
