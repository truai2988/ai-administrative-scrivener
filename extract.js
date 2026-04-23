const ExcelJS = require('exceljs');

async function main() {
  const workbook = new ExcelJS.Workbook();
  const filePath = 'C:/Users/truee/ai-administrative-scrivener/Application_form/在留資格認定証明書/Book7.xlsm';
  
  console.log(`Reading ${filePath}...`);
  await workbook.xlsx.readFile(filePath);
  
  console.log('Sheets:');
  workbook.eachSheet((worksheet, id) => {
    console.log(`- ${worksheet.name} (id: ${id})`);
  });

  const sheet = workbook.getWorksheet('申請情報入力(在留資格認定証明書交付申請)');
  if (!sheet) {
    console.log('Sheet not found.');
    return;
  }

  console.log('\nData Validations:');
  const validations = sheet.dataValidations;
  
  if (validations && validations.model) {
      let count = 0;
      for (const [address, validation] of Object.entries(validations.model)) {
          console.log(`[${address}] Type: ${validation.type}, Formulae: ${validation.formulae ? validation.formulae.join(', ') : 'none'}`);
          count++;
          if(count > 10) break;
      }
  } else {
      console.log('No data validations found via exceljs.');
  }
}

main().catch(console.error);
