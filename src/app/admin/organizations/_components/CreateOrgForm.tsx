'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, AlertCircle, Building2, Tag, MapPin, Phone, Loader2 } from 'lucide-react';
import type { OrganizationType } from '@/types/database';
import { createOrganizationSchema } from '@/lib/schemas/organizationSchema';
import { createOrganization } from '@/lib/api/adminClient';

interface CreateOrgFormProps {
  showForm: boolean;
  onClose: () => void;
  onSuccess: () => void;
  showToast: (type: 'success' | 'error', message: string) => void;
}

export function CreateOrgForm({ showForm, onClose, onSuccess, showToast }: CreateOrgFormProps) {
  const [orgFormData, setOrgFormData] = useState({
    name: '',
    type: 'union' as OrganizationType,
    address: '',
    phone: '',
  });
  const [orgFormError, setOrgFormError] = useState<string | null>(null);
  const [savingOrg, setSavingOrg] = useState(false);

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrgFormError(null);

    const parsed = createOrganizationSchema.safeParse(orgFormData);
    if (!parsed.success) {
      setOrgFormError(Object.values(parsed.error.flatten().fieldErrors).flat().join('、'));
      return;
    }

    setSavingOrg(true);
    try {
      await createOrganization(parsed.data);
      showToast('success', '組織を作成しました');
      setOrgFormData({ name: '', type: 'union', address: '', phone: '' });
      onSuccess();
    } catch (err: unknown) {
      const e = err as Error;
      setOrgFormError(e.message ?? '組織の作成に失敗しました');
    } finally {
      setSavingOrg(false);
    }
  };

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
              <Plus size={17} className="text-indigo-500" />
              新規組織の登録
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <X size={16} className="text-slate-400" />
            </button>
          </div>

          <form onSubmit={handleCreateOrg} className="p-5 space-y-4">
            {orgFormError && (
              <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-100 rounded-xl text-sm text-rose-700">
                <AlertCircle size={16} className="shrink-0" />
                {orgFormError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 組織名 */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  組織名 <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                  <input
                    type="text"
                    value={orgFormData.name}
                    onChange={(e) => setOrgFormData({ ...orgFormData, name: e.target.value })}
                    placeholder="例: 東京支部"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    required
                  />
                </div>
              </div>

              {/* 組織種別 */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  組織種別 <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                  <select
                    value={orgFormData.type}
                    onChange={(e) =>
                      setOrgFormData({ ...orgFormData, type: e.target.value as OrganizationType })
                    }
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all appearance-none"
                  >
                    <option value="union">組合（union）</option>
                    <option value="enterprise">企業（enterprise）</option>
                  </select>
                </div>
              </div>

              {/* 住所 */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  住所
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                  <input
                    type="text"
                    value={orgFormData.address}
                    onChange={(e) => setOrgFormData({ ...orgFormData, address: e.target.value })}
                    placeholder="東京都千代田区..."
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              {/* 電話番号 */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  電話番号
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                  <input
                    type="tel"
                    value={orgFormData.phone}
                    onChange={(e) => setOrgFormData({ ...orgFormData, phone: e.target.value })}
                    placeholder="03-0000-0000"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  />
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
                disabled={savingOrg}
                className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {savingOrg ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                組織を作成
              </button>
            </div>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
