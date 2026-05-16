import { z } from 'zod';
import { UserRole } from '@/types/database';

export const supportSchema = z.object({
  subject: z.string()
    .min(1, '件名を入力してください')
    .max(100, '件名は100文字以内で入力してください'),
  body: z.string()
    .min(10, '問い合わせ内容は10文字以上でご記入ください')
    .max(2000, '問い合わせ内容は2000文字以内でご記入ください'),
});

export type SupportFormData = z.infer<typeof supportSchema>;

export interface Inquiry extends SupportFormData {
  id: string;
  status: 'open' | 'in_progress' | 'closed';
  createdAt: string;
  userId: string;
  userRole: UserRole;
  unionId: string;
  tenantId: string;
}
