const fs = require('fs');
const path = require('path');

const raw = require('./dropdowns_renewal.json');

const mapped = {
  nationality: raw._CA61_L || [],
  gender: raw._C611_L || [],
  yesNo: raw._A021_L || [],
  entryPurpose: raw._C970_L || [], // Residence Status
  relationship: raw._CB06_L || [], // Relatives' relationship
  receivingOffice: raw._CB52_L || [], // 札幌出入国在留管理局 etc
};

const artifactPath = path.join('C:', 'Users', 'truee', '.gemini', 'antigravity', 'brain', '4eaed7d1-7429-4591-907d-bf600b8a77e2', 'scratch', 'dropdowns_renewal.json');

fs.writeFileSync(artifactPath, JSON.stringify(mapped, null, 2), 'utf8');
console.log('Written mapped JSON to', artifactPath);
