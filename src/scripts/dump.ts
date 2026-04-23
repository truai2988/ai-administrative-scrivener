import fs from 'fs';

// read U headers
const contentU = fs.readFileSync('c:/Users/truee/ai-administrative-scrivener/Application_form/在留資格変更/申請情報入力(区分U)_1.csv', 'utf-8');
const headersU = contentU.split('\n')[0].split(',').map(s => s.trim());
console.log('U headers:', headersU.length);

const contentSim = fs.readFileSync('c:/Users/truee/ai-administrative-scrivener/Application_form/在留資格変更/申請情報入力(同時申請)_1.csv', 'utf-8');
const headersSim = contentSim.split('\n')[0].split(',').map(s => s.trim());
console.log('Sim headers:', headersSim.length);

fs.writeFileSync('c:/Users/truee/ai-administrative-scrivener/src/scripts/dumpHeaders.json', JSON.stringify({ headersU, headersSim }, null, 2));
