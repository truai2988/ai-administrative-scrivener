import { generateRenewalCsv } from './src/utils/renewalCsvGenerator';
import type { RenewalApplicationFormData } from './src/lib/schemas/renewalApplicationSchema';

const mockData = {
  foreignerInfo: {
    nationality: '101 アイスランド Republic of Iceland',
    birthDate: '1990-01-01',
    nameEn: 'JOHN DOE',
    gender: 'male',
    maritalStatus: 'unmarried',
    occupation: 'ENGINEER',
    homeCountryAddress: 'REYKJAVIK',
    japanZipCode: '1000001',
    japanPrefecture: '東京都',
    japanCity: '千代田区',
    japanAddressLines: '1-1-1',
    phoneNumber: '0312345678',
    email: 'test@example.com',
    passportNumber: 'A1234567',
    passportExpiryDate: '2030-01-01',
    currentResidenceStatus: '121 技術・人文知識・国際業務',
    currentStayPeriod: '1年',
    stayExpiryDate: '2025-01-01',
    hasResidenceCard: true,
    residenceCardNumber: 'AB12345678CD',
    desiredStayPeriod: '3年',
    renewalReason: 'CONTINUE WORKING',
    criminalRecord: false,
    hasRelatives: true,
    relatives: [
      {
        relationship: '333 妹',
        name: 'JANE DOE',
        birthDate: '1995-01-01',
        nationality: '101 アイスランド Republic of Iceland',
        cohabitation: false,
        workplace: 'COMPANY',
        residenceCardNumber: 'AB12345678CD'
      }
    ],
    residenceCardReceiptMethod: 'window',
    receivingOffice: '430 東京出入国在留管理局長',
    checkIntent: true,
    agent: {
      relationship: '111 父',
      name: 'JACK DOE'
    }
  },
  employerInfo: {
    name: 'TEST COMPANY',
    branchName: '',
    zipCode: '1000001',
    prefecture: '東京都',
    city: '千代田区',
    addressLines: '1-1-1',
    phone: '0312345678'
  }
};

async function test() {
  try {
    const uint8Array = generateRenewalCsv(mockData.foreignerInfo as any);
    console.log('Successfully generated CSV.');
    
    const decoder = new TextDecoder('shift-jis');
    const content = decoder.decode(uint8Array);
    
    let allPassed = true;
    
    if (!content.includes('101 アイスランド Republic of Iceland')) {
      console.error('❌ MAPPING FAILED: Nationality missing in CSV output.');
      allPassed = false;
    } else {
      console.log('✅ Nationality mapped successfully.');
    }

    if (!content.includes('430 東京出入国在留管理局長')) {
      console.error('❌ MAPPING FAILED: Receiving Office missing in CSV output.');
      allPassed = false;
    } else {
      console.log('✅ Receiving Office mapped successfully.');
    }

    if (!content.includes('333 妹')) {
      console.error('❌ MAPPING FAILED: Relatives relationship missing in CSV output.');
      allPassed = false;
    } else {
      console.log('✅ Relatives Relationship mapped successfully.');
    }

    if (!content.includes('121 技術・人文知識・国際業務')) {
      console.error('❌ MAPPING FAILED: Residence Status missing in CSV output.');
      allPassed = false;
    } else {
      console.log('✅ Residence Status mapped successfully.');
    }

    if (allPassed) {
      console.log('\n🎉 ALL TESTS PASSED: CSV output correctly contains government-specified exact strings.');
    }
  } catch (err) {
    console.error('Error during CSV generation:', err);
  }
}

test();
