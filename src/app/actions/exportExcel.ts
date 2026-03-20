'use server';

import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';
import { Foreigner, Client } from '@/types/database';

/**
 * Excel Export Server Action
 * 指定された外国人データと支援機関データをExcelテンプレートに流し込み、
 * Base64形式のバッファを返します（クライアント側でダウンロードするため）。
 */
export async function generateApplicationExcel(foreigner: Foreigner, client?: Client) {
  try {
    const templatePath = path.join(process.cwd(), 'templates', 'renewal_tokuteiginou.xlsx');
    const workbook = new ExcelJS.Workbook();
    
    if (fs.existsSync(templatePath)) {
      await workbook.xlsx.readFile(templatePath);
    } else {
      // フォールバック: テンプレートがない場合は新規作成（デモ用）
      const sheet = workbook.addWorksheet('申請書');
      // セルのスタイルやプレースホルダを最低限設定
      sheet.getCell('C5').value = '氏名';
      sheet.getCell('F10').value = '国籍';
      sheet.getCell('C7').value = '生年月日';
      sheet.getCell('C12').value = '在留カード番号';
      sheet.getCell('C20').value = '所属機関';
    }

    const worksheet = workbook.getWorksheet(1);

    if (!worksheet) {
      throw new Error('ワークシートが見つかりません。');
    }

    // 1. 氏名 (C5)
    worksheet.getCell('C5').value = foreigner.name;

    // 2. 国籍 (F10)
    worksheet.getCell('F10').value = foreigner.nationality;

    // 3. 生年月日 (C7) - yyyy/mm/dd形式
    const birthDate = new Date(foreigner.birthDate);
    worksheet.getCell('C7').value = `${birthDate.getFullYear()}/${String(birthDate.getMonth() + 1).padStart(2, '0')}/${String(birthDate.getDate()).padStart(2, '0')}`;

    // 4. 在留カード番号 (C12)
    worksheet.getCell('C12').value = foreigner.residenceCardNumber;

    // 5. 支援機関名 (C20)
    if (client) {
      worksheet.getCell('C20').value = client.name;
    } else {
      // clientがない場合はForeignerのモックデータから補完（プロトタイプ用）
      worksheet.getCell('C20').value = foreigner.company || '未登録';
    }

    // バッファを生成してBase64で返す
    const buffer = await workbook.xlsx.writeBuffer();
    return {
      success: true,
      data: Buffer.from(buffer).toString('base64'),
      filename: `${foreigner.name}_更新申請書.xlsx`
    };

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Excel Generation Error:', error);
    return { success: false, error: errorMessage };
  }
}
