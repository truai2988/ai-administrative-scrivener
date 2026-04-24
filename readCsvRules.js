const fs = require('fs');
const iconv = require('iconv-lite');
const { parse } = require('csv-parse/sync');

const files = [
  'Application_form/在留期間更新/申請情報入力(在留期間更新許可申請).csv',
  'Application_form/在留期間更新/申請情報入力(区分V).csv',
  'Application_form/在留期間更新/申請情報入力(同時申請).csv'
];

files.forEach(file => {
  console.log(`\n--- Rules for ${file} ---`);
  try {
    const buffer = fs.readFileSync(file);
    const decoded = iconv.decode(buffer, 'Shift_JIS');
    const records = parse(decoded, { skip_empty_lines: true });
    
    // row 1 is headers (index 0)
    // row 2 is rules (index 1)
    if (records.length >= 2) {
      const headers = records[0];
      const rules = records[1];
      
      headers.forEach((h, i) => {
        if (rules[i] && rules[i].trim() !== '') {
          console.log(`[${i}] ${h}: ${rules[i]}`);
        }
      });
    }
  } catch (e) {
    console.error(`Error processing ${file}:`, e.message);
  }
});
