/**
 * 申請取次依頼書・承諾書 PDF生成ユーティリティ (クライアントサイド)
 * 
 * jsPDFはブラウザ環境で動作するため、クライアントサイドで実行する。
 * consentLogの電子同意記録（IP・タイムスタンプ）を含む法的文書を生成。
 */

import { Foreigner } from '@/types/database';

function formatConsentDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return isoString;
  }
}

export async function generateConsentPdfClient(foreigner: Foreigner): Promise<{
  success: boolean;
  blob?: Blob;
  filename?: string;
  error?: string;
}> {
  try {
    if (!foreigner.consentLog) {
      return { success: false, error: '電子同意記録が見つかりません。' };
    }

    const { jsPDF } = await import('jspdf');

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = 210;
    const marginL = 25;
    const marginR = 25;
    const contentWidth = pageWidth - marginL - marginR;
    let y = 20; // 30 -> 20 (上部余白を削減)

    // ===== ヘッダー =====
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Application Delegation Request', pageWidth / 2, y, { align: 'center' });
    y += 8;
    pdf.setFontSize(14);
    pdf.text('& Consent Agreement', pageWidth / 2, y, { align: 'center' });
    y += 6;

    // サブタイトル
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Shinsei Toritsugi Iraisho / Shoudakusho', pageWidth / 2, y, { align: 'center' });
    y += 10; // 12 -> 10

    // 区切り線
    pdf.setDrawColor(100, 100, 200);
    pdf.setLineWidth(0.5);
    pdf.line(marginL, y, pageWidth - marginR, y);
    y += 10; // 12 -> 10

    // ===== 申請人情報 =====
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('1. Applicant Information', marginL, y);
    y += 8;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');

    const infoItems = [
      ['Full Name (Shimei)', foreigner.name || '-'],
      ['Nationality (Kokuseki)', foreigner.nationality || '-'],
      ['Date of Birth (Seinengappi)', foreigner.birthDate || '-'],
      ['Residence Card No.', foreigner.residenceCardNumber || '-'],
      ['Expiry Date (Zairyu Kigen)', foreigner.expiryDate || '-'],
      ['Status of Residence', foreigner.visaType || '-'],
      ['Organization (Shozoku Kikan)', foreigner.company || '-'],
      ['Job Description', foreigner.jobTitle || foreigner.aiReview?.jobTitle || '-'],
    ];

    infoItems.forEach(([label, value]) => {
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${label}:`, marginL + 4, y);
      pdf.setFont('helvetica', 'normal');
      pdf.text(value, marginL + 80, y);
      y += 5.5; // 7 -> 5.5 (行間を詰める)
    });

    y += 4;

    // ===== 委任内容 =====
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('2. Scope of Delegation', marginL, y);
    y += 8;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');

    const delegationText = [
      'The applicant hereby delegates the following immigration',
      'procedures to the registered administrative scrivener:',
      '',
      '  - Preparation and submission of application for renewal',
      '    / change of status of residence',
      '  - Communication with the Immigration Services Agency',
      '  - Handling of all related administrative procedures',
    ];

    delegationText.forEach((line) => {
      pdf.text(line, marginL + 4, y);
      y += 4.5; // 5.5 -> 4.5
    });

    y += 4;

    // ===== 電子同意記録 =====
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('3. Electronic Consent Record', marginL, y);
    y += 8;

    // 強調枠
    pdf.setDrawColor(0, 128, 100);
    pdf.setFillColor(240, 253, 244);
    pdf.roundedRect(marginL, y - 4, contentWidth, 28, 3, 3, 'FD'); // 32 -> 28 (枠を少し詰める)

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 100, 80);

    const consentDate = formatConsentDate(foreigner.consentLog.agreedAt);
    const consentIp = foreigner.consentLog.ipAddress;

    pdf.text('ELECTRONIC CONSENT CONFIRMED', marginL + 4, y + 4);
    y += 8; // 10 -> 8
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Date: ${consentDate}`, marginL + 4, y + 2);
    y += 6;
    pdf.text(`IP Address: ${consentIp}`, marginL + 4, y + 2);
    y += 5; // 6 -> 5

    if (foreigner.consentLog.userAgent) {
      const ua = foreigner.consentLog.userAgent.substring(0, 70);
      pdf.setFontSize(7);
      pdf.text(`User-Agent: ${ua}`, marginL + 4, y + 2);
    }

    pdf.setTextColor(0, 0, 0);
    y += 10;

    // ===== 誓約文 =====
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('4. Declaration', marginL, y);
    y += 8;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');

    const declarationText = [
      'I declare that all information provided is true and',
      'accurate. I consent to the delegation of the above',
      'immigration procedures and understand that:',
      '',
      '  1. The accuracy of submitted information is guaranteed.',
      '  2. Personal information will be used for immigration',
      '     application purposes only.',
      '  3. Any changes will be promptly communicated.',
    ];

    declarationText.forEach((line) => {
      pdf.text(line, marginL + 4, y);
      y += 4.5; // 5.5 -> 4.5
    });

    y += 8;

    // ===== 署名欄 =====
    pdf.setDrawColor(150, 150, 150);
    pdf.setLineWidth(0.3);
    pdf.setFontSize(9);
    pdf.text('Applicant Signature:', marginL, y);
    pdf.line(marginL + 40, y + 1, marginL + contentWidth / 2 - 5, y + 1);
    y += 8;
    pdf.setFontSize(7);
    pdf.text(`(Electronically signed via web form - ${consentDate})`, marginL, y);

    // ===== フッター (ページ最下部に固定) =====
    pdf.setFontSize(6);
    pdf.setTextColor(160, 160, 160);
    pdf.text(
      `Generated: ${new Date().toISOString()} | AI Administrative Scrivener System`,
      pageWidth / 2,
      292,
      { align: 'center' }
    );

    const blob = pdf.output('blob');
    const safeName = (foreigner.name || 'applicant').replace(/[^a-zA-Z0-9]/g, '_');

    return {
      success: true,
      blob,
      filename: `ConsentForm_${safeName}_${foreigner.id}.pdf`,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Consent PDF Generation Error:', error);
    return { success: false, error: errorMessage };
  }
}
