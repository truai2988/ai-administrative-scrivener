/**
 * 入管オンライン申請用 画像圧縮・変換ユーティリティ
 * 
 * - 顔写真: JPEG 50KB以下に圧縮
 * - 添付書類(在留カード等): PDF形式に変換、10MB以下に制御
 */

import imageCompression from 'browser-image-compression';

/**
 * 顔写真用圧縮
 * 画像をJPEG形式に変換し、50KB以下にリサイズ・圧縮する。
 */
export async function compressPhotoForImmigration(
  file: File,
  onProgress?: (progress: number) => void,
): Promise<{ file: File; originalSize: number; compressedSize: number }> {
  const originalSize = file.size;

  const options = {
    maxSizeMB: 0.05, // 50KB = 0.05MB
    maxWidthOrHeight: 600, // 入管の顔写真は縦4cm×横3cm (概ね480×360px程度) に余裕を持った上限
    useWebWorker: true,
    fileType: 'image/jpeg' as const,
    initialQuality: 0.8,
    onProgress: (p: number) => {
      if (onProgress) onProgress(p);
    },
  };

  const compressedBlob = await imageCompression(file, options);

  // Blob → File に変換（拡張子を .jpg に）
  const baseName = file.name.replace(/\.[^.]+$/, '');
  const compressedFile = new File([compressedBlob], `${baseName}.jpg`, {
    type: 'image/jpeg',
    lastModified: Date.now(),
  });

  return {
    file: compressedFile,
    originalSize,
    compressedSize: compressedFile.size,
  };
}

/**
 * 添付書類用圧縮（画像 → PDF変換）
 * 画像をPDF形式に変換し、10MB以下に収める。
 */
export async function compressDocumentToPdf(
  file: File,
  onProgress?: (progress: number) => void,
): Promise<{ file: File; originalSize: number; compressedSize: number }> {
  const originalSize = file.size;
  const MAX_SIZE_MB = 10;

  // まず画像を適度に圧縮（PDFに変換する前に画像サイズを削減）
  if (onProgress) onProgress(10);

  let imageFile = file;

  // 画像ファイルの場合のみ圧縮処理
  if (file.type.startsWith('image/')) {
    const compressOptions = {
      maxSizeMB: MAX_SIZE_MB * 0.8, // 最終的にPDFに入れるので余裕を持つ
      maxWidthOrHeight: 2480, // A4 300dpiに相当する幅
      useWebWorker: true,
      initialQuality: 0.85,
      onProgress: (p: number) => {
        if (onProgress) onProgress(10 + p * 0.5); // 10-60%
      },
    };

    const compressedBlob = await imageCompression(file, compressOptions);
    imageFile = new File([compressedBlob], file.name, {
      type: compressedBlob.type,
      lastModified: Date.now(),
    });
  }

  if (onProgress) onProgress(60);

  // 画像 → PDF変換 (jsPDF)
  const { jsPDF } = await import('jspdf');

  // 画像をロードしてサイズを取得
  const imgUrl = URL.createObjectURL(imageFile);
  const img = await loadImage(imgUrl);
  URL.revokeObjectURL(imgUrl);

  if (onProgress) onProgress(70);

  // A4サイズ (210 x 297mm) に収める
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 10;

  const availW = pageWidth - margin * 2;
  const availH = pageHeight - margin * 2;

  let imgW = availW;
  let imgH = (img.height / img.width) * imgW;

  if (imgH > availH) {
    imgH = availH;
    imgW = (img.width / img.height) * imgH;
  }

  const offsetX = margin + (availW - imgW) / 2;
  const offsetY = margin + (availH - imgH) / 2;

  const pdf = new jsPDF({
    orientation: imgW > imgH ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Canvas経由でJPEGデータを取得
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.85);

  pdf.addImage(jpegDataUrl, 'JPEG', offsetX, offsetY, imgW, imgH);

  if (onProgress) onProgress(90);

  // PDFをBlobに変換
  const pdfBlob = pdf.output('blob');

  // 10MB超えチェック（超える場合は品質を下げて再出力）
  let finalBlob = pdfBlob;
  if (pdfBlob.size > MAX_SIZE_MB * 1024 * 1024) {
    // 再圧縮: さらに画像品質を下げる
    const lowerQualityDataUrl = canvas.toDataURL('image/jpeg', 0.5);
    const pdf2 = new jsPDF({
      orientation: imgW > imgH ? 'landscape' : 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    pdf2.addImage(lowerQualityDataUrl, 'JPEG', offsetX, offsetY, imgW, imgH);
    finalBlob = pdf2.output('blob');
  }

  const baseName = file.name.replace(/\.[^.]+$/, '');
  const pdfFile = new File([finalBlob], `${baseName}.pdf`, {
    type: 'application/pdf',
    lastModified: Date.now(),
  });

  if (onProgress) onProgress(100);

  return {
    file: pdfFile,
    originalSize,
    compressedSize: pdfFile.size,
  };
}

/**
 * ファイルサイズを人間が読みやすい形式に変換
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
