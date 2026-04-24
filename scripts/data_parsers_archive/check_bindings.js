/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');

const extractNames = (filename, prefix) => {
  const content = fs.readFileSync(filename, 'utf-8');
  
  // Find all string literals that start with prefix
  const regex1 = /name=\{?["']([^"']+)["']\}?/g;
  const regex2 = /register\(['"]([^'"]+)['"]\)/g;
  
  const foundKeys = new Set();
  let match;
  while ((match = regex1.exec(content)) !== null) {
      if(match[1].startsWith(prefix)) foundKeys.add(match[1]);
  }
  while ((match = regex2.exec(content)) !== null) {
      if(match[1].startsWith(prefix)) foundKeys.add(match[1]);
  }
  return Array.from(foundKeys).sort();
};

console.log("== ForeignerInfoSection ==");
console.log(extractNames('./src/components/forms/sections/ForeignerInfoSection.tsx', 'foreignerInfo.').join('\n'));
console.log("\n== EmployerInfoSection ==");
console.log(extractNames('./src/components/forms/sections/EmployerInfoSection.tsx', 'employerInfo.').join('\n'));
/* eslint-disable @typescript-eslint/no-require-imports */

