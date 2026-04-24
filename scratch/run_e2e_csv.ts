import { generateChangeSpecificCsv } from './src/lib/csv/change/generateChangeSpecificCsv';
import type { ChangeOfStatusApplicationFormData } from './src/lib/schemas/changeOfStatusApplicationSchema';

const dummyBase: any = {
  applicationInfo: {
    targetForeigners: [],
    representativeName: 'Test Representative',
  },
  foreignerInfo: {
    lastName: 'TEST',
    firstName: 'USER',
    residenceCardNumber: 'AA1234567',
    changeReason: 'Test reason',
    nationalityCode: 'test',
    nationalityName: 'Testland',
    gender: 'Male',
    birthDate: '1990-01-01',
    addressPref: 'Tokyo',
    addressCity: 'Shibuya',
    currentResidenceStatus: 'Student',
    currentStayPeriod: '1 year',
    stayExpiryDate: '2027-01-01',
    hasResidenceCard: true,
  },
  employerInfo: {
    companyName: 'Test Company',
    companyZipCode: '123-4567',
    companyPref: 'Tokyo',
    companyCity: 'Shibuya',
    representativeName: 'CEO',
    isSocialInsuranceApplicable: true,
    isLaborInsuranceApplicable: true,
  }
};

const caseA = JSON.parse(JSON.stringify(dummyBase));
caseA.foreignerInfo.desiredResidenceStatus = '特定技能１号 Specified Skilled Worker ( i )';
caseA.employerInfo.delegateSupportEntirely = true;
caseA.employerInfo.supportAgency = {
  name: 'Test Agency',
  registrationNumber: '12345',
  supportLanguages: 'English',
  supportSupervisorName: 'Supervisor A',
};

const caseB = JSON.parse(JSON.stringify(dummyBase));
caseB.foreignerInfo.desiredResidenceStatus = '特定技能２号 Specified Skilled Worker ( ii )';

console.log('--- TEST CASE A: 特定技能1号 ---');
try {
  const csvA = generateChangeSpecificCsv(caseA as ChangeOfStatusApplicationFormData);
  // naive split to check length (assuming no commas in dummy data)
  const lenA = csvA.split(',').length;
  console.log(`CSV string length in commas/cols: ${lenA}`);
  // Let's actually check if it contains the dummy data
  console.log('delegateSupportEntirely (should be "有"):', csvA.includes('"有"'));
  console.log('Support Agency Name:', csvA.includes('"Test Agency"'));
} catch (e) {
  console.error('Error in Case A:', e);
}

console.log('\n--- TEST CASE B: 特定技能2号 ---');
try {
  const csvB = generateChangeSpecificCsv(caseB as ChangeOfStatusApplicationFormData);
  const lenB = csvB.split(',').length;
  console.log(`CSV string length in commas/cols: ${lenB}`);
  console.log('Did it throw undefined errors?: NO');
} catch (e) {
  console.error('Error in Case B:', e);
}
