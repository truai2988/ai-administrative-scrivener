/**
 * ダミーPDF生成スクリプト
 * node --experimental-modules scripts/generateDummyPdf.mjs
 */
import { jsPDF } from 'jspdf';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const doc = new jsPDF({ unit: 'pt', format: 'a4' });

// タイトル
doc.setFontSize(18);
doc.text('PDF Overlay Test Document', 50, 60);

// 説明
doc.setFontSize(11);
doc.text('This is a dummy PDF for testing overlay fields.', 50, 100);

// テキスト入力テスト用のラベル
doc.setFontSize(12);
doc.text('Name:', 50, 160);
doc.rect(120, 145, 250, 22); // 入力枠

doc.text('Address:', 50, 200);
doc.rect(120, 185, 250, 22); // 入力枠

// チェックボックステスト用
doc.text('Options:', 50, 260);
doc.text('Option A', 80, 290);
doc.rect(55, 278, 16, 16);  // チェックボックス枠
doc.text('Option B', 80, 320);
doc.rect(55, 308, 16, 16);

// ラジオボタンテスト用
doc.text('Gender:', 50, 380);
doc.text('Male', 80, 410);
doc.circle(63, 406, 8); // ラジオ丸
doc.text('Female', 80, 440);
doc.circle(63, 436, 8);

// 丸囲みテスト用
doc.text('Classification:', 50, 500);
doc.setFontSize(14);
doc.text('A', 80, 530);
doc.text('B', 120, 530);
doc.text('C', 160, 530);

const outputPath = path.resolve(__dirname, '..', 'public', 'dummy.pdf');
const pdfBytes = doc.output('arraybuffer');
fs.writeFileSync(outputPath, Buffer.from(pdfBytes));
console.log(`Dummy PDF generated at: ${outputPath}`);
