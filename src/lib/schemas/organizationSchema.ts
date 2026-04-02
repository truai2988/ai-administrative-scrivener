import { z } from 'zod';

// ─── 組織（Organization）スキーマ ───────────────────────────────────────────

export const organizationTypeSchema = z.enum(['hq', 'branch', 'enterprise']);

export const organizationSchema = z.object({
  id: z.string(),
  name: z.string().min(1, '組織名は必須です').max(100, '組織名は100文字以内です'),
  type: organizationTypeSchema,
  address: z.string().max(200).optional(),
  phone: z.string().max(20).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/** 管理画面からの組織作成フォーム用スキーマ（id / timestamps は除外） */
export const createOrganizationSchema = z.object({
  name: z.string().min(1, '組織名は必須です').max(100, '組織名は100文字以内です'),
  type: organizationTypeSchema,
  address: z.string().max(200).optional(),
  phone: z.string().max(20).optional(),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;

// ─── ユーザー（User）スキーマ ─────────────────────────────────────────────────

export const userRoleSchema = z.enum(['scrivener', 'hq_admin', 'branch_staff', 'enterprise_staff']);

export const userSchema = z.object({
  id: z.string(),
  email: z.string().email('有効なメールアドレスを入力してください'),
  displayName: z.string().min(1, '表示名は必須です').max(50, '表示名は50文字以内です'),
  role: userRoleSchema,
  organizationId: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/**
 * Admin API: ユーザー作成リクエストのスキーマ
 * - scrivener は organizationId 不要
 * - その他のロールは organizationId 必須
 */
export const createUserRequestSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z
    .string()
    .min(8, 'パスワードは8文字以上です')
    .max(100, 'パスワードは100文字以内です'),
  displayName: z.string().min(1, '表示名は必須です').max(50, '表示名は50文字以内です'),
  role: userRoleSchema,
  organizationId: z.string().nullable().optional(),
}).superRefine((data, ctx) => {
  // scrivener 以外は organizationId が必須
  if (data.role !== 'scrivener' && !data.organizationId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['organizationId'],
      message: '行政書士以外のロールでは所属組織は必須です',
    });
  }
});

export type CreateUserRequest = z.infer<typeof createUserRequestSchema>;
