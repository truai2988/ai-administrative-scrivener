const fs = require('fs');
const sjis = require('encoding-japanese');

const csv_files = [
  'Application_form/在留期間更新/申請情報入力(在留期間更新許可申請).csv',
  'Application_form/在留期間更新/申請情報入力(区分V).csv',
  'Application_form/在留期間更新/申請情報入力(同時申請).csv'
];

for(let file of csv_files) {
  const buf = fs.readFileSync(file);
  const text = sjis.convert(buf, {to: 'UNICODE', type: 'string'});
  const headers = text.split('\n')[0].replace(/^\uFEFF/, '').replace(/\r$/, '').split(',');
  console.log(file, 'has', headers.length, 'headers');
}
