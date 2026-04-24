const fs = require('fs');
const sjis = require('encoding-japanese');

// Read actual CSV files
const getCsvHeaders = (file) => {
  const buf = fs.readFileSync(file);
  const text = sjis.convert(buf, {to: 'UNICODE', type: 'string'});
  return text.split('\n')[0].replace(/^\uFEFF/, '').replace(/\r$/, '').split(',');
};

const h1 = getCsvHeaders('Application_form/在留期間更新/申請情報入力(在留期間更新許可申請).csv');
const h2 = getCsvHeaders('Application_form/在留期間更新/申請情報入力(区分V).csv');
const h3 = getCsvHeaders('Application_form/在留期間更新/申請情報入力(同時申請).csv');

fs.writeFileSync('scratch/h1.json', JSON.stringify(h1, null, 2));
fs.writeFileSync('scratch/h2.json', JSON.stringify(h2, null, 2));
fs.writeFileSync('scratch/h3.json', JSON.stringify(h3, null, 2));
console.log('Saved CSV headers to scratch/h1.json, h2.json, h3.json');
