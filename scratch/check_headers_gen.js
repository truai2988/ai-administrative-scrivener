const fs = require('fs');
const t1 = fs.readFileSync('src/utils/renewalCsvGenerator.ts', 'utf8');

const { renewalFormOptions } = require('./src/lib/constants/renewalFormOptions.js'); // Cannot require ts directly
