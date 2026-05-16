'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Landmark, Plus, Trash2, Pencil, Save, Loader2,
  X, AlertCircle
} from 'lucide-react';
import { unionMasterService } from '@/services/unionMasterService';
import type { UnionMaster } from '@/types/database';
import { isGlobalAdmin } from '@/types/database';
import type { UserRole } from '@/types/database';
import { ToastContainer, useToast } from '@/components/ui/Toast';

// ────────────────────────────────────────────────────────
// 空フォーム
// ────────────────────────────────────────────────────────
const EMPTY_FORM: Omit<UnionMaster, 'id' | 'createdAt' | 'updatedAt'> = {
  organizationId: '',
  unionNameJa: '',
  hasCorporateNumber: false,
  corporateNumber: '',
  permissionNumber: '',
  zipCode: '',
  pref: '',
  city: '',
  addressLines: '',
  address: '',
  phone: '',
  representativeTitle: '',
  representativeName: '',
  contactPerson: '',
};

// ────────────────────────────────────────────────────────
// フォームモーダル
// ────────────────────────────────────────────────────────
function UnionFormModal({
  initial,
  organizationId,
  isScrivener,
  onSave,
  onClose,
}: {
  initial?: UnionMaster;
  organizationId: string;
  isScrivener: boolean;
  onSave: () => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Omit<UnionMaster, 'id' | 'createdAt' | 'updatedAt'>>({
    ...EMPTY_FORM,
    organizationId,
    ...(initial
      ? {
          unionNameJa: initial.unionNameJa,
          hasCorporateNumber: initial.hasCorporateNumber,
          corporateNumber: initial.corporateNumber ?? '',
          permissionNumber: initial.permissionNumber ?? '',
          zipCode: initial.zipCode,
          pref: initial.pref,
          city: initial.city,
          addressLines: initial.addressLines,
          address: initial.address ?? '',
          phone: initial.phone,
          representativeTitle: initial.representativeTitle,
          representativeName: initial.representativeName,
          contactPerson: initial.contactPerson,
          organizationId: initial.organizationId || organizationId,
        }
      : {}),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (key: keyof typeof form, value: unknown) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.unionNameJa.trim()) {
      setError('組合名は必須です');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (initial) {
        await unionMasterService.update(initial.id, form);
      } else {
        await unionMasterService.create(form);
      }
      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all';
  const labelClass = 'block text-xs font-bold text-slate-600 mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Landmark size={20} className="text-indigo-600" />
            {initial ? '組合マスタを編集' : '新規組合マスタを登録'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* ─── 基本情報 ─── */}
          <section>
            <h3 className="text-sm font-bold text-slate-700 border-b border-slate-100 pb-2 mb-4">
              組合基本情報
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={labelClass}>組合名 *</label>
                <input
                  className={inputClass}
                  value={form.unionNameJa}
                  onChange={(e) => update('unionNameJa', e.target.value)}
                  placeholder="例: 協同組合〇〇"
                  required
                />
              </div>

              {isScrivener && (
                <div className="sm:col-span-2">
                  <label className={labelClass}>
                    管理テナントID（テナント分離用）
                    <span className="ml-2 text-slate-400 font-normal">※行政書士のみ表示</span>
                  </label>
                  <input
                    className={inputClass}
                    value={form.organizationId}
                    onChange={(e) => update('organizationId', e.target.value)}
                    placeholder="該当する組合のテナントIDを入力"
                  />
                </div>
              )}

              <div>
                <label className={labelClass}>許可・登録番号</label>
                <input
                  className={inputClass}
                  value={form.permissionNumber}
                  onChange={(e) => update('permissionNumber', e.target.value)}
                  placeholder="例: 許123456789"
                />
              </div>

              <div>
                <label className={labelClass}>電話番号 *</label>
                <input
                  className={inputClass}
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  placeholder="例: 0312345678"
                  type="tel"
                />
              </div>

              <div>
                <label className={labelClass}>法人番号の有無</label>
                <div className="flex gap-4 mt-2">
                  {[
                    { value: true, label: '有' },
                    { value: false, label: '無' },
                  ].map((opt) => (
                    <label key={String(opt.value)} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name="hasCorporateNumber"
                        checked={form.hasCorporateNumber === opt.value}
                        onChange={() => update('hasCorporateNumber', opt.value)}
                        className="accent-indigo-600"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>

              {form.hasCorporateNumber && (
                <div>
                  <label className={labelClass}>法人番号（13桁）</label>
                  <input
                    className={inputClass}
                    value={form.corporateNumber}
                    onChange={(e) => update('corporateNumber', e.target.value)}
                    placeholder="1234567890123"
                    maxLength={13}
                  />
                </div>
              )}
            </div>
          </section>

          {/* ─── 代表者・担当者 ─── */}
          <section>
            <h3 className="text-sm font-bold text-slate-700 border-b border-slate-100 pb-2 mb-4">
              代表者・担当者
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>代表者役職 *</label>
                <input
                  className={inputClass}
                  value={form.representativeTitle}
                  onChange={(e) => update('representativeTitle', e.target.value)}
                  placeholder="例: 代表理事"
                />
              </div>

              <div>
                <label className={labelClass}>代表者氏名 *</label>
                <input
                  className={inputClass}
                  value={form.representativeName}
                  onChange={(e) => update('representativeName', e.target.value)}
                  placeholder="例: 山田 太郎"
                />
              </div>

              <div className="sm:col-span-2">
                <label className={labelClass}>担当者氏名 *</label>
                <input
                  className={inputClass}
                  value={form.contactPerson}
                  onChange={(e) => update('contactPerson', e.target.value)}
                  placeholder="例: 鈴木 一郎"
                />
              </div>
            </div>
          </section>

          {/* ─── 組合所在地 ─── */}
          <section>
            <h3 className="text-sm font-bold text-slate-700 border-b border-slate-100 pb-2 mb-4">
              組合所在地
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>郵便番号</label>
                <input
                  className={inputClass}
                  value={form.zipCode}
                  onChange={(e) => update('zipCode', e.target.value)}
                  placeholder="例: 1000001"
                />
              </div>
              <div>
                <label className={labelClass}>都道府県</label>
                <input
                  className={inputClass}
                  value={form.pref}
                  onChange={(e) => update('pref', e.target.value)}
                  placeholder="例: 東京都"
                />
              </div>
              <div>
                <label className={labelClass}>市区町村</label>
                <input
                  className={inputClass}
                  value={form.city}
                  onChange={(e) => update('city', e.target.value)}
                  placeholder="例: 千代田区"
                />
              </div>
              <div>
                <label className={labelClass}>番地等</label>
                <input
                  className={inputClass}
                  value={form.addressLines}
                  onChange={(e) => update('addressLines', e.target.value)}
                  placeholder="例: 千代田1-1-1"
                />
              </div>
            </div>
          </section>

          {/* ─── ボタン ─── */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-sm"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {initial ? '変更を保存する' : '登録する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────
// メインコンポーネント
// ────────────────────────────────────────────────────────
export function UnionMasterContent() {
  const { currentUser, loading: authLoading } = useAuth();
  const { toasts, dismiss, show: showToast } = useToast();

  const [unions, setUnions] = useState<UnionMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<UnionMaster | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const organizationId = (() => {
    if (!currentUser) return null;
    if (isGlobalAdmin(currentUser.role as UserRole)) return 'hq_direct';
    return currentUser.organizationId ?? null;
  })();

  const isScrivener = currentUser?.role === 'scrivener';

  // union_staff には新規作成と削除の権限を与えない
  const canCreate = isScrivener;
  const canDelete = isScrivener;

  const load = async () => {
    setLoading(true);
    try {
      const targetOrgId = isScrivener ? undefined : (currentUser?.organizationId ?? 'unknown');
      const data = await unionMasterService.getAll(targetOrgId);
      setUnions(data);
    } catch (err) {
      console.error('[UnionMasters] Load error:', err);
      showToast('error', '組合マスタの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading || !currentUser) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, authLoading]);

  const handleDelete = async (id: string, name: string) => {
    if (!canDelete) return;
    if (!confirm(`「${name}」を削除してもよいですか？`)) return;
    setDeletingId(id);
    try {
      await unionMasterService.delete(id);
      showToast('success', `「${name}」を削除しました`);
      setUnions((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      console.error(err);
      showToast('error', '削除に失敗しました');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaved = () => {
    setShowModal(false);
    setEditTarget(undefined);
    showToast('success', '組合マスタを保存しました');
    load();
  };

  if (authLoading || loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800">組合マスタ</h2>
          <p className="text-xs text-slate-500 mt-1">申請フォームで自動入力される「監理団体・登録支援機関」情報を管理します</p>
        </div>
        {canCreate && (
          <button
            onClick={() => { setEditTarget(undefined); setShowModal(true); }}
            className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus size={16} />
            新規登録
          </button>
        )}
      </div>

      {unions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-12 text-center">
          <Landmark size={40} className="text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">組合マスタが登録されていません</p>
          <p className="text-slate-400 text-sm mt-1 mb-6">
            登録すると申請フォームの関連フィールドに法人情報が一括自動入力できます。
          </p>
          {canCreate ? (
            <button
              onClick={() => { setEditTarget(undefined); setShowModal(true); }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <Plus size={16} />
              最初の組合を登録する
            </button>
          ) : (
            <p className="text-sm text-slate-400">システム管理者（行政書士）による登録をお待ちください。</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {unions.map((union) => (
            <div
              key={union.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col sm:flex-row sm:items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Landmark size={16} className="text-indigo-500 shrink-0" />
                  <span className="font-bold text-slate-800 truncate">{union.unionNameJa}</span>
                  {union.hasCorporateNumber && union.corporateNumber && (
                    <span className="shrink-0 text-xs bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full">
                      法人番号: {union.corporateNumber}
                    </span>
                  )}
                  {union.permissionNumber && (
                    <span className="shrink-0 text-xs bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full">
                      許可・登録番号: {union.permissionNumber}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500">
                  {[union.pref, union.city, union.addressLines]
                    .filter(Boolean)
                    .join('')}
                </p>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  {union.representativeName && (
                    <span className="text-xs text-slate-500">代表: {union.representativeTitle} {union.representativeName}</span>
                  )}
                  {union.contactPerson && (
                    <span className="text-xs text-slate-500">担当: {union.contactPerson}</span>
                  )}
                  {union.phone && (
                    <span className="text-xs text-slate-500">☎ {union.phone}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => { setEditTarget(union); setShowModal(true); }}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                >
                  <Pencil size={13} />
                  編集
                </button>
                {canDelete && (
                  <button
                    onClick={() => handleDelete(union.id, union.unionNameJa)}
                    disabled={deletingId === union.id}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-100 disabled:opacity-50"
                  >
                    {deletingId === union.id ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Trash2 size={13} />
                    )}
                    削除
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── モーダル ──────────────────────────────────────────────────── */}
      {showModal && organizationId && (
        <UnionFormModal
          initial={editTarget}
          organizationId={organizationId}
          isScrivener={isScrivener}
          onSave={handleSaved}
          onClose={() => { setShowModal(false); setEditTarget(undefined); }}
        />
      )}

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
