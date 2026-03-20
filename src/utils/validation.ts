import { z } from 'zod';
import { differenceInMonths, isPast, parseISO } from 'date-fns';

/**
 * Zod validation schemas for practical administrative procedures.
 */

// 在留カード番号: 英字2桁 + 数字8桁 + 英字2桁 (例: AB12345678CD)
const residenceCardRegex = /^[A-Z]{2}\d{8}[A-Z]{2}$/;

export const ForeignerSchema = z.object({
  name: z.string().min(1, '氏名は必須です'),
  birthDate: z.string().min(1, '生年月日は必須です'),
  nationality: z.string().min(1, '国籍は必須です'),
  residenceCardNumber: z
    .string()
    .regex(residenceCardRegex, '非正規の在留カード番号です (例: AB12345678CD)'),
  expiryDate: z.string().refine((val) => {
    const date = parseISO(val);
    // 未来の日付かつ3ヶ月以上先であることを推奨 (今日から3ヶ月以内、または過去なら要警告)
    // ここではバリデーションエラーではなく、ビジネスロジックで警告を出すべきだが、
    // 厳密なチェックとして実装する場合は以下。
    return !isPast(date);
  }, {
    message: '在留期限が切れているか、過去の日付です',
  }),
});

/**
 * Perform manual warning checks that Zod might be too strict for (e.g. "3 months warning")
 */
export const checkExpiryWarning = (expiryDateStr: string) => {
  const expiryDate = parseISO(expiryDateStr);
  const now = new Date();
  const monthsDiff = differenceInMonths(expiryDate, now);

  if (isPast(expiryDate)) {
    return { type: 'error', message: '在留期限がすでに切れています。早急な対応が必要です。' };
  }
  
  if (monthsDiff < 3) {
    return { type: 'warning', message: '在留期限まで3ヶ月を切っています。更新手続きが必要です。' };
  }

  return { type: 'info', message: '正常' };
};
