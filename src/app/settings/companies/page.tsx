'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  Building2, Plus, Trash2, Pencil, Save, Loader2,
  ArrowLeft, X, CheckCircle2, AlertCircle
} from 'lucide-react';
import { companyMasterService } from '@/services/companyMasterService';
import type { CompanyMaster } from '@/types/database';
import { isGlobalAdmin } from '@/types/database';
import type { UserRole } from '@/types/database';
import { ToastContainer, useToast } from '@/components/ui/Toast';
import Link from 'next/link';

// ────────────────────────────────────────────────────────
// 空フォーム
// ────────────────────────────────────────────────────────
const EMPTY_FORM: Omit<CompanyMaster, 'id' | 'createdAt' | 'updatedAt'> = {
  organizationId: '',
  companyNameJa: '',
  hasCorporateNumber: false,
  corporateNumber: '',
  companyZipCode: '',
  companyPref: '',
  companyCity: '',
  companyAddressLines: '',
  companyAddress: '',
  companyPhone: '',
  representativeName: '',
  workplaceName: '',
  workplaceZipCode: '',
  workplacePref: '',
  workplaceCity: '',
  workplaceAddressLines: '',
  employeeCount: undefined,
  capital: undefined,
  annualRevenue: undefined,
  isSocialInsuranceApplicable: undefined,
  isLaborInsuranceApplicable: undefined,
  laborInsuranceNumber: '',
  employmentInsuranceNumber: '',
};

// ────────────────────────────────────────────────────────
// フォームモーダル
// ────────────────────────────────────────────────────────
function CompanyFormModal({
  initial,
  organizationId,
  onSave,
  onClose,
}: {
  initial?: CompanyMaster;
  organizationId: string;
  onSave: () => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Omit<CompanyMaster, 'id' | 'createdAt' | 'updatedAt'>>({
    ...EMPTY_FORM,
    organizationId,
    ...(initial
      ? {
          companyNameJa: initial.companyNameJa,
          hasCorporateNumber: initial.hasCorporateNumber,
          corporateNumber: initial.corporateNumber ?? '',
          companyZipCode: initial.companyZipCode,
          companyPref: initial.companyPref,
          companyCity: initial.companyCity,
          companyAddressLines: initial.companyAddressLines,
          companyAddress: initial.companyAddress ?? '',
          companyPhone: initial.companyPhone,
          representativeName: initial.representativeName,
          workplaceName: initial.workplaceName ?? '',
          workplaceZipCode: initial.workplaceZipCode ?? '',
          workplacePref: initial.workplacePref ?? '',
          workplaceCity: initial.workplaceCity ?? '',
          workplaceAddressLines: initial.workplaceAddressLines ?? '',
          employeeCount: initial.employeeCount,
          capital: initial.capital,
          annualRevenue: initial.annualRevenue,
          isSocialInsuranceApplicable: initial.isSocialInsuranceApplicable,
          isLaborInsuranceApplicable: initial.isLaborInsuranceApplicable,
          laborInsuranceNumber: initial.laborInsuranceNumber ?? '',
          employmentInsuranceNumber: initial.employmentInsuranceNumber ?? '',
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
    if (!form.companyNameJa.trim()) {
      setError('法人名は必須です');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (initial) {
        await companyMasterService.update(initial.id, form);
      } else {
        await companyMasterService.create(form);
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
        {/* ヘッダー */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Building2 size={20} className="text-indigo-600" />
            {initial ? '企業マスタを編集' : '新規企業マスタを登録'}
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

          {/* ─── 法人基本情報 ─── */}
          <section>
            <h3 className="text-sm font-bold text-slate-700 border-b border-slate-100 pb-2 mb-4">
              法人基本情報
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={labelClass}>法人名 *</label>
                <input
                  className={inputClass}
                  value={form.companyNameJa}
                  onChange={(e) => update('companyNameJa', e.target.value)}
                  placeholder="例: 株式会社〇〇製作所"
                  required
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

              <div>
                <label className={labelClass}>電話番号 *</label>
                <input
                  className={inputClass}
                  value={form.companyPhone}
                  onChange={(e) => update('companyPhone', e.target.value)}
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

          {/* ─── 法人所在地 ─── */}
          <section>
            <h3 className="text-sm font-bold text-slate-700 border-b border-slate-100 pb-2 mb-4">
              法人所在地
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>郵便番号</label>
                <input
                  className={inputClass}
                  value={form.companyZipCode}
                  onChange={(e) => update('companyZipCode', e.target.value)}
                  placeholder="例: 1000001"
                />
              </div>
              <div>
                <label className={labelClass}>都道府県</label>
                <input
                  className={inputClass}
                  value={form.companyPref}
                  onChange={(e) => update('companyPref', e.target.value)}
                  placeholder="例: 東京都"
                />
              </div>
              <div>
                <label className={labelClass}>市区町村</label>
                <input
                  className={inputClass}
                  value={form.companyCity}
                  onChange={(e) => update('companyCity', e.target.value)}
                  placeholder="例: 千代田区"
                />
              </div>
              <div>
                <label className={labelClass}>番地等</label>
                <input
                  className={inputClass}
                  value={form.companyAddressLines}
                  onChange={(e) => update('companyAddressLines', e.target.value)}
                  placeholder="例: 千代田1-1-1"
                />
              </div>
            </div>
          </section>

          {/* ─── 勤務事業所 ─── */}
          <section>
            <h3 className="text-sm font-bold text-slate-700 border-b border-slate-100 pb-2 mb-4">
              勤務事業所（法人所在地と異なる場合）
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={labelClass}>事業所名</label>
                <input
                  className={inputClass}
                  value={form.workplaceName}
                  onChange={(e) => update('workplaceName', e.target.value)}
                  placeholder="例: 第一工場"
                />
              </div>
              <div>
                <label className={labelClass}>事業所 郵便番号</label>
                <input
                  className={inputClass}
                  value={form.workplaceZipCode}
                  onChange={(e) => update('workplaceZipCode', e.target.value)}
                  placeholder="例: 1000001"
                />
              </div>
              <div>
                <label className={labelClass}>事業所 都道府県</label>
                <input
                  className={inputClass}
                  value={form.workplacePref}
                  onChange={(e) => update('workplacePref', e.target.value)}
                  placeholder="例: 神奈川県"
                />
              </div>
              <div>
                <label className={labelClass}>事業所 市区町村</label>
                <input
                  className={inputClass}
                  value={form.workplaceCity}
                  onChange={(e) => update('workplaceCity', e.target.value)}
                  placeholder="例: 横浜市"
                />
              </div>
              <div>
                <label className={labelClass}>事業所 番地等</label>
                <input
                  className={inputClass}
                  value={form.workplaceAddressLines}
                  onChange={(e) => update('workplaceAddressLines', e.target.value)}
                  placeholder="例: 中区1-1-1"
                />
              </div>
            </div>
          </section>

          {/* ─── 規模・財務 ─── */}
          <section>
            <h3 className="text-sm font-bold text-slate-700 border-b border-slate-100 pb-2 mb-4">
              規模・財務情報（任意）
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>従業員数（人）</label>
                <input
                  type="number"
                  className={inputClass}
                  value={form.employeeCount ?? ''}
                  onChange={(e) => update('employeeCount', e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="例: 50"
                  min={1}
                />
              </div>
              <div>
                <label className={labelClass}>資本金（万円）</label>
                <input
                  type="number"
                  className={inputClass}
                  value={form.capital ?? ''}
                  onChange={(e) => update('capital', e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="例: 1000"
                  min={0}
                />
              </div>
              <div>
                <label className={labelClass}>売上高（万円）</label>
                <input
                  type="number"
                  className={inputClass}
                  value={form.annualRevenue ?? ''}
                  onChange={(e) => update('annualRevenue', e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="例: 50000"
                  min={0}
                />
              </div>
            </div>
          </section>

          {/* ─── 保険情報 ─── */}
          <section>
            <h3 className="text-sm font-bold text-slate-700 border-b border-slate-100 pb-2 mb-4">
              保険情報（任意）
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>社会保険適用</label>
                <div className="flex gap-4 mt-2">
                  {[{ value: true, label: '適用あり' }, { value: false, label: '適用なし' }].map((opt) => (
                    <label key={String(opt.value)} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name="isSocialInsurance"
                        checked={form.isSocialInsuranceApplicable === opt.value}
                        onChange={() => update('isSocialInsuranceApplicable', opt.value)}
                        className="accent-indigo-600"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelClass}>労働保険適用</label>
                <div className="flex gap-4 mt-2">
                  {[{ value: true, label: '適用あり' }, { value: false, label: '適用なし' }].map((opt) => (
                    <label key={String(opt.value)} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name="isLaborInsurance"
                        checked={form.isLaborInsuranceApplicable === opt.value}
                        onChange={() => update('isLaborInsuranceApplicable', opt.value)}
                        className="accent-indigo-600"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>
              {form.isLaborInsuranceApplicable && (
                <div>
                  <label className={labelClass}>労働保険番号</label>
                  <input
                    className={inputClass}
                    value={form.laborInsuranceNumber}
                    onChange={(e) => update('laborInsuranceNumber', e.target.value)}
                    placeholder="1234567890123"
                  />
                </div>
              )}
              <div>
                <label className={labelClass}>雇用保険適用事業所番号</label>
                <input
                  className={inputClass}
                  value={form.employmentInsuranceNumber}
                  onChange={(e) => update('employmentInsuranceNumber', e.target.value)}
                  placeholder="12345678901"
                  maxLength={11}
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

/** アクセス許可ロール（モジュールレベル定数） */
const ALLOWED_ROLES: UserRole[] = ['scrivener', 'union_staff'];

// ────────────────────────────────────────────────────────
// メインページ
// ────────────────────────────────────────────────────────
export default function CompanyMastersPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toasts, dismiss, show: showToast } = useToast();

  const [companies, setCompanies] = useState<CompanyMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<CompanyMaster | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // scrivener → 'hq_direct'（全社マスタ）
  // union_staff         → 自支部の organizationId
  const organizationId = (() => {
    if (!currentUser) return null;
    if (isGlobalAdmin(currentUser.role as UserRole)) return 'hq_direct';
    // union_staff は自支部 ID を使用
    return currentUser.organizationId ?? null;
  })();

  // 戻るリンクは常にダッシュボード（ホーム）へ
  const backHref = '/';

  const load = async () => {
    if (!organizationId) return;
    setLoading(true);
    try {
      const data = await companyMasterService.getAll(organizationId);
      setCompanies(data);
    } catch (err) {
      console.error('[CompanyMasters] Load error:', err);
      showToast('error', '企業マスタの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!currentUser) {
      router.push('/login');
      return;
    }
    // 許可されていないロールはトップへリダイレクト
    if (!ALLOWED_ROLES.includes(currentUser.role as UserRole)) {
      router.push('/');
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, authLoading]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`「${name}」を削除してもよいですか？`)) return;
    setDeletingId(id);
    try {
      await companyMasterService.delete(id);
      showToast('success', `「${name}」を削除しました`);
      setCompanies((prev) => prev.filter((c) => c.id !== id));
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
    showToast('success', '企業マスタを保存しました');
    load();
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      {/* ─── ヘッダー ─────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-xs">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={backHref}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Building2 size={22} className="text-indigo-600" />
                企業マスタ管理
              </h1>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                申請フォームで自動入力される「所属機関（雇用主）」情報を事前登録します
              </p>
            </div>
          </div>
          <button
            onClick={() => { setEditTarget(undefined); setShowModal(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus size={16} />
            新規登録
          </button>
        </div>
      </header>

      {/* ─── メインコンテンツ ─────────────────────────────────────────── */}
      <main className="max-w-4xl mx-auto px-6 py-8">

        {companies.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-12 text-center">
            <Building2 size={40} className="text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">企業マスタが登録されていません</p>
            <p className="text-slate-400 text-sm mt-1 mb-6">
              登録すると申請フォームのプルダウンに表示され、法人情報を一括自動入力できます。
            </p>
            <button
              onClick={() => { setEditTarget(undefined); setShowModal(true); }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <Plus size={16} />
              最初の企業を登録する
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {companies.map((company) => (
              <div
                key={company.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 size={16} className="text-indigo-500 shrink-0" />
                    <span className="font-bold text-slate-800 truncate">{company.companyNameJa}</span>
                    {company.hasCorporateNumber && company.corporateNumber && (
                      <span className="shrink-0 text-xs bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full">
                        法人番号: {company.corporateNumber}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500">
                    {[company.companyPref, company.companyCity, company.companyAddressLines]
                      .filter(Boolean)
                      .join('')}
                  </p>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    {company.representativeName && (
                      <span className="text-xs text-slate-500">代表: {company.representativeName}</span>
                    )}
                    {company.companyPhone && (
                      <span className="text-xs text-slate-500">☎ {company.companyPhone}</span>
                    )}
                    {company.employeeCount && (
                      <span className="text-xs text-slate-500">従業員 {company.employeeCount}名</span>
                    )}
                    {company.isSocialInsuranceApplicable && (
                      <span className="text-xs flex items-center gap-1 text-emerald-600">
                        <CheckCircle2 size={12} /> 社保
                      </span>
                    )}
                    {company.isLaborInsuranceApplicable && (
                      <span className="text-xs flex items-center gap-1 text-emerald-600">
                        <CheckCircle2 size={12} /> 労保
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => { setEditTarget(company); setShowModal(true); }}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                  >
                    <Pencil size={13} />
                    編集
                  </button>
                  <button
                    onClick={() => handleDelete(company.id, company.companyNameJa)}
                    disabled={deletingId === company.id}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-100 disabled:opacity-50"
                  >
                    {deletingId === company.id ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Trash2 size={13} />
                    )}
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ─── モーダル ──────────────────────────────────────────────────── */}
      {showModal && organizationId && (
        <CompanyFormModal
          initial={editTarget}
          organizationId={organizationId}
          onSave={handleSaved}
          onClose={() => { setShowModal(false); setEditTarget(undefined); }}
        />
      )}

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
