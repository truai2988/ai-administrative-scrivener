'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, X, AlertCircle, ShieldCheck, User, Mail, Lock, EyeOff, Eye, Building2, Loader2 } from 'lucide-react';
import type { Organization, UserRole, OrganizationType } from '@/types/database';
import { createUserRequestSchema } from '@/lib/schemas/organizationSchema';
import { createUser } from '@/lib/api/adminClient';
import { ORGANIZATION_TYPE_LABELS } from '@/types/database';

function roleToOrganizationType(role: UserRole): OrganizationType | 'any' {
  switch (role) {
    case 'hq_admin':
      return 'hq';
    case 'branch_staff':
      return 'branch';
    case 'enterprise_staff':
      return 'enterprise';
    default:
      return 'any'; // scrivener は組織不要
  }
}

interface CreateUserFormProps {
  showForm: boolean;
  onClose: () => void;
  onSuccess: () => void;
  showToast: (type: 'success' | 'error', message: string) => void;
  organizations: Organization[];
}

export function CreateUserForm({ showForm, onClose, onSuccess, showToast, organizations }: CreateUserFormProps) {
  const [userFormData, setUserFormData] = useState({
    email: '',
    password: '',
    displayName: '',
    role: 'branch_staff' as UserRole,
    organizationId: '',
  });
  const [userFormError, setUserFormError] = useState<string | null>(null);
  const [savingUser, setSavingUser] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserFormError(null);

    const payload = {
      ...userFormData,
      organizationId: userFormData.organizationId || null,
    };

    const parsed = createUserRequestSchema.safeParse(payload);
    if (!parsed.success) {
      const errs = parsed.error.flatten();
      const msgs = [
        ...Object.values(errs.fieldErrors).flat(),
        ...errs.formErrors,
      ].join('、');
      setUserFormError(msgs);
      return;
    }

    setSavingUser(true);
    try {
      await createUser(parsed.data);
      showToast('success', `ユーザー「${userFormData.displayName}」を作成しました`);
      setUserFormData({ email: '', password: '', displayName: '', role: 'branch_staff', organizationId: '' });
      onSuccess();
    } catch (err: unknown) {
      const e = err as Error;
      setUserFormError(e.message ?? 'ユーザーの作成に失敗しました');
    } finally {
      setSavingUser(false);
    }
  };

  const requiredOrgType = roleToOrganizationType(userFormData.role);
  const filteredOrgs =
    requiredOrgType === 'any'
      ? organizations
      : organizations.filter((o) => o.type === requiredOrgType);

  return (
    <AnimatePresence>
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
        >
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h2 className="font-bold text-base flex items-center gap-2">
              <UserPlus size={17} className="text-indigo-500" />
              新規ユーザーアカウント発行
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <X size={16} className="text-slate-400" />
            </button>
          </div>

          {/* 注意書き */}
          <div className="mx-5 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
            <ShieldCheck size={15} className="text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700 font-medium leading-relaxed">
              発行したメールアドレスとパスワードを当該ユーザーに安全な方法で共有してください。
            </p>
          </div>

          <form onSubmit={handleCreateUser} className="p-5 space-y-4">
            {userFormError && (
              <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-100 rounded-xl text-sm text-rose-700">
                <AlertCircle size={16} className="shrink-0" />
                {userFormError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 表示名 */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  表示名 <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                  <input
                    type="text"
                    value={userFormData.displayName}
                    onChange={(e) => setUserFormData({ ...userFormData, displayName: e.target.value })}
                    placeholder="例: 山田 太郎"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    required
                  />
                </div>
              </div>

              {/* ロール */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  ロール <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                  <select
                    value={userFormData.role}
                    onChange={(e) =>
                      setUserFormData({
                        ...userFormData,
                        role: e.target.value as UserRole,
                        organizationId: '', // ロール変更時は組織をリセット
                      })
                    }
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all appearance-none"
                  >
                    <option value="hq_admin">本部管理者（hq_admin）</option>
                    <option value="branch_staff">支部事務員（branch_staff）</option>
                    <option value="enterprise_staff">企業担当者（enterprise_staff）</option>
                  </select>
                </div>
              </div>

              {/* メールアドレス */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  メールアドレス <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                  <input
                    type="email"
                    value={userFormData.email}
                    onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                    placeholder="user@example.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    required
                  />
                </div>
              </div>

              {/* パスワード */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  初期パスワード <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={userFormData.password}
                    onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                    placeholder="8文字以上"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* 所属組織 */}
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  所属組織 <span className="text-rose-400">*</span>
                  <span className="ml-2 normal-case text-slate-400 font-normal">
                    （ロールに合わせた組織のみ表示）
                  </span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                  <select
                    value={userFormData.organizationId}
                    onChange={(e) => setUserFormData({ ...userFormData, organizationId: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all appearance-none"
                    required
                  >
                    <option value="">── 組織を選択してください ──</option>
                    {filteredOrgs.length === 0 ? (
                      <option disabled>対象組織が見つかりません（先に組織を作成してください）</option>
                    ) : (
                      filteredOrgs.map((org) => (
                        <option key={org.id} value={org.id}>
                          [{ORGANIZATION_TYPE_LABELS[org.type]}] {org.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={savingUser}
                className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {savingUser ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}
                アカウントを発行
              </button>
            </div>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
