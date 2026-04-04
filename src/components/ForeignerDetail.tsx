'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Foreigner, UserRole } from '@/types/database';
import { foreignerService } from '@/services/foreignerService';
import { canRequestReview, canApproveOrReturn } from '@/utils/permissions';
import { CorrectionHistoryList } from './CorrectionHistoryList';
import { StatusBadge } from './StatusBadge';
import {
  X, ShieldAlert, Info, Calendar, ClipboardList, Lock, Globe, Monitor,
  Edit3, Loader2, UserCircle, CheckCircle2, ExternalLink,
  Building2, CheckCircle, XCircle, Send, RotateCcw, FileText, FilePen,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExcelDownloadButton } from './ExcelDownloadButton';
import { ConsentPdfButton } from './ConsentPdfButton';

// ─── ユーティリティ ────────────────────────────────────────────────────────────

function formatAgreeDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  } catch {
    return isoString;
  }
}

/** 編集フォームの初期値を foreigner から生成するヘルパー */
 // ─── 型定義 ───────────────────────────────────────────────────────────────────

interface ForeignerDetailProps {
  foreigner: Foreigner;
  onClose: () => void;
  onUpdate: (updated: Foreigner) => void;
  userRole?: UserRole;
}

// ─── コンポーネント ───────────────────────────────────────────────────────────

export const ForeignerDetail: React.FC<ForeignerDetailProps> = ({
  foreigner,
  onClose,
  onUpdate,
  userRole = 'scrivener',
}) => {
  // ── 権限フラグ ──────────────────────────────────────────────────────────────
  const isHqAdmin = userRole === 'hq_admin';

  const allowApproveOrReturn = canApproveOrReturn(userRole);

  const allowRequestReview =
    canRequestReview(userRole) ||
    (isHqAdmin && foreigner.branchId === 'hq_direct');

  // ── ローカルステート ────────────────────────────────────────────────────────
  const [isWorkflowLoading, setIsWorkflowLoading] = useState(false);
  const [returnReasonInput, setReturnReasonInput] = useState('');
  const [showReturnForm, setShowReturnForm] = useState(false);

  // ── 表示用判定フラグ（可読性・保守性向上のためJSXから抽出） ───────────────
  const isStatusDraft = foreigner.status === '準備中' || foreigner.status === '編集中' || foreigner.status === '差し戻し';
  const isStatusPendingReview = foreigner.approvalStatus === 'pending_review' || foreigner.status === 'チェック中';
  const isStatusReturned = foreigner.approvalStatus === 'returned';
  
  // (旧データ等でapprovalStatusがない場合へのフォールバックを考慮)
  const isWorkflowDraftOrReturned = !foreigner.approvalStatus || foreigner.approvalStatus === 'draft' || isStatusReturned;

  // 各セクションの表示条件
  const showRequestReviewSection = allowRequestReview && isStatusDraft && isWorkflowDraftOrReturned;
  const showPendingReviewBanner = allowRequestReview && isStatusPendingReview;
  const showApproveReturnSection = allowApproveOrReturn && isStatusPendingReview;

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, [foreigner]);

  // ── データ不整合チェック（バグ修復用）──────────────────────────────────────

  // ── ハンドラ ────────────────────────────────────────────────────────────────



  const handleHealApproved = useCallback(async () => {
    try {
      await foreignerService.updateForeignerDataAdmin(foreigner.id, { status: '申請済' });
      onUpdate({ ...foreigner, status: '申請済' });
    } catch (e) {
      console.error('Approved heal failed:', e);
      alert('修復に失敗しました');
    }
  }, [foreigner, onUpdate]);

  const handleRequestReview = useCallback(async () => {
    setIsWorkflowLoading(true);
    try {
      await foreignerService.updateApprovalStatus(foreigner.id, 'pending_review');
      onUpdate({ ...foreigner, approvalStatus: 'pending_review', status: 'チェック中' });
    } catch (err) {
      alert(`確認依頼に失敗しました: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsWorkflowLoading(false);
    }
  }, [foreigner, onUpdate]);

  const handleApprove = useCallback(async () => {
    setIsWorkflowLoading(true);
    try {
      await foreignerService.updateApprovalStatus(foreigner.id, 'approved');
      onUpdate({ ...foreigner, approvalStatus: 'approved', status: '申請済' });
      setShowReturnForm(false);
    } catch (err) {
      alert(`承認処理に失敗しました: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsWorkflowLoading(false);
    }
  }, [foreigner, onUpdate]);

  const handleReturn = useCallback(async () => {
    setIsWorkflowLoading(true);
    try {
      await foreignerService.updateApprovalStatus(foreigner.id, 'returned', returnReasonInput);
      onUpdate({ ...foreigner, approvalStatus: 'returned', returnReason: returnReasonInput, status: '差し戻し' });
      setShowReturnForm(false);
      setReturnReasonInput('');
    } catch (err) {
      alert(`差し戻し処理に失敗しました: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsWorkflowLoading(false);
    }
  }, [foreigner, returnReasonInput, onUpdate]);

  // ── 変更差分の検出（上部バッジ・修正前データ表示用）─────────────────────────
  const DIFF_KEYS: (keyof Foreigner)[] = useMemo(
    () => [
      'name', 'nationality', 'birthDate', 'residenceCardNumber', 'expiryDate',
      'email', 'company', 'visaType', 'jobTitle', 'experience',
      'salary', 'allowances', 'socialInsurance', 'housingProvided',
    ],
    []
  );
  const hasAdminDiff = useMemo(
    () => foreigner.originalSubmittedData != null &&
      DIFF_KEYS.some(k => foreigner.originalSubmittedData?.[k] !== foreigner[k]),
    [foreigner, DIFF_KEYS]
  );

  /** 承認済みなのにstatusが「申請済」になっていないデータを示すフラグ */
  const hasApprovedMismatch =
    foreigner.approvalStatus === 'approved' && foreigner.status !== '申請済';

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-slate-50 overflow-y-auto no-scrollbar">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="min-h-screen pb-20"
        >
          {/* ─── Sticky Header ─────────────────────────────────────────────── */}
          <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100 z-10 shadow-sm">
            <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <button
                  onClick={onClose}
                  className="p-2 -ml-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition-all"
                  title="一覧に戻る"
                >
                  <X className="h-6 w-6" />
                </button>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                    {foreigner.name}
                    {hasAdminDiff && (
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 bg-amber-100 text-amber-700 border border-amber-200">
                        <Edit3 className="w-3 h-3" />
                        初期データから修正あり
                      </span>
                    )}
                  </h2>
                  <p className="text-sm font-bold text-slate-400 tracking-wide uppercase">
                    {foreigner.nationality} • ID: {foreigner.id}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {userRole === 'scrivener' && (
                    <ExcelDownloadButton foreigner={foreigner} variant="compact" />
                  )}
                  <ConsentPdfButton foreigner={foreigner} variant="compact" />
                </div>
              </div>
            </div>
          </div>

          {/* ─── Main Content ──────────────────────────────────────────────── */}
          <div className="max-w-5xl mx-auto p-8 space-y-10">
            {/* 承認済みなのに申請済になっていない場合の修復バナー */}
            {hasApprovedMismatch && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                <p className="text-sm text-amber-700 font-bold flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5" />
                  データ不整合: 承認済みですが「{foreigner.status}」になっています。
                </p>
                <button
                  onClick={handleHealApproved}
                  className="px-4 py-2 bg-amber-600 text-white text-xs font-bold rounded-lg hover:bg-amber-700 active:scale-95 transition-all"
                >
                  修復して「申請済」に変更
                </button>
              </div>
            )}


            {/* 現在のステータス */}
            <section className="bg-slate-50 rounded-2xl p-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">現在のステータス</p>
                <StatusBadge status={foreigner.status} />
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">在留期限</p>
                <p className="text-lg font-bold text-rose-600">{foreigner.expiryDate}</p>
              </div>
            </section>

            {/* アクションボタン群（編集＆確認依頼） */}
            {(foreigner.current_application_id || showRequestReviewSection) && (
                <section className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-6 space-y-4">
                  {foreigner.approvalStatus === 'returned' && foreigner.returnReason && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                      <p className="font-bold mb-1">⚠ 差し戻し理由</p>
                      <p>{foreigner.returnReason}</p>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => window.open(`/forms/renewal/${foreigner.id}`, '_blank')}
                      className="px-5 py-3 bg-white text-indigo-600 border border-indigo-200 text-sm font-bold rounded-xl hover:bg-indigo-50 transition-all active:scale-95 flex items-center gap-2 shadow-sm"
                    >
                      <FilePen className="h-4 w-4" />
                      {foreigner.current_application_id ? '申請書を編集する' : '申請書データを作成する'}
                    </button>

                    {showRequestReviewSection && (
                      <button
                        disabled={isWorkflowLoading}
                        onClick={handleRequestReview}
                        className="px-5 py-3 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-indigo-100 disabled:opacity-60"
                      >
                        {isWorkflowLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        行政書士へ確認依頼
                      </button>
                    )}
                  </div>
                </section>
              )}

            {/* branch_staff: 確認依頼送信済みバナー */}
            {showPendingReviewBanner && (
              <section className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex flex-col gap-2 shadow-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                  <p className="text-sm font-bold text-emerald-800">行政書士へ確認依頼を送信しました</p>
                </div>
                <p className="text-xs text-emerald-700 ml-7 leading-relaxed flex flex-col gap-1">
                  <span>現在、行政書士側のチェック・承認待ち状態です。</span>
                  <span className="font-bold opacity-80 mt-1">※ この画面を閉じて、他の業務を進めていただいて問題ありません。</span>
                </p>
              </section>
            )}

            {/* scrivener: 承認・差し戻しボタン */}
            {showApproveReturnSection && (
              <section className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-emerald-800 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  承認ワークフロー（確認待ち）
                </h3>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => window.open(`/forms/renewal/${foreigner.id}`, '_blank')}
                    className="px-5 py-2.5 bg-white text-emerald-700 border border-emerald-200 text-sm font-bold rounded-xl hover:bg-emerald-50 transition-all active:scale-95 flex items-center gap-2 shadow-sm"
                  >
                    <FilePen className="h-4 w-4" />
                    {foreigner.current_application_id ? '申請書を編集する' : '申請書データを作成する'}
                  </button>
                  <button
                    disabled={isWorkflowLoading}
                    onClick={handleApprove}
                    className="px-5 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-emerald-100 disabled:opacity-60"
                  >
                    {isWorkflowLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    承認済にする
                  </button>
                  <button
                    disabled={isWorkflowLoading}
                    onClick={() => setShowReturnForm(v => !v)}
                    className="px-5 py-2.5 bg-amber-500 text-white text-sm font-bold rounded-xl hover:bg-amber-600 transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-amber-100 disabled:opacity-60"
                  >
                    <RotateCcw className="h-4 w-4" />
                    差し戻し
                  </button>
                </div>
                {showReturnForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-3"
                  >
                    <textarea
                      value={returnReasonInput}
                      onChange={e => setReturnReasonInput(e.target.value)}
                      placeholder="差し戻しの理由を入力してください..."
                      className="w-full p-3 bg-white border border-amber-200 rounded-xl text-sm resize-none focus:ring-2 focus:ring-amber-400 outline-none"
                      rows={3}
                    />
                    <button
                      disabled={isWorkflowLoading || !returnReasonInput.trim()}
                      onClick={handleReturn}
                      className="px-5 py-2.5 bg-rose-600 text-white text-sm font-bold rounded-xl hover:bg-rose-700 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-60"
                    >
                      {isWorkflowLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                      差し戻しを確定する
                    </button>
                  </motion.div>
                )}
              </section>
            )}

            {/* AI リーガルチェック */}
            <section className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-indigo-500" />
                AI リーガルチェック結果
              </h3>
              {foreigner.aiReview ? (
                <div className={`rounded-2xl p-6 border ${foreigner.aiReview.riskScore > 50 ? 'bg-rose-50 border-rose-100' : 'bg-indigo-50 border-indigo-100'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-bold text-slate-600">不許可リスクスコア</span>
                    <span className={`text-2xl font-black ${foreigner.aiReview.riskScore > 50 ? 'text-rose-600' : 'text-indigo-600'}`}>
                      {foreigner.aiReview.riskScore}%
                    </span>
                  </div>
                  <div className="w-full bg-white/50 rounded-full h-2 mb-4">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${foreigner.aiReview.riskScore > 50 ? 'bg-rose-500' : 'bg-indigo-500'}`}
                      style={{ width: `${foreigner.aiReview.riskScore}%` }}
                    />
                  </div>
                  <div className="flex gap-3 bg-white/60 p-4 rounded-xl border border-white/40">
                    <Info className="h-5 w-5 text-slate-400 shrink-0" />
                    <p className="text-sm text-slate-700 leading-relaxed">{foreigner.aiReview.reason}</p>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-10 text-center">
                  <ClipboardList className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">AIによるチェックはまだ行われていません。</p>
                </div>
              )}
            </section>

            {/* ─── 登録内容：表示 ──────────────────────────── */}
            <div className="space-y-10">
              <ViewMode foreigner={foreigner} hasAdminDiff={hasAdminDiff} diffKeys={DIFF_KEYS} />
            </div>
            
            {/* データ修正履歴 */}
            <CorrectionHistoryList foreignerId={foreigner.id} userRole={userRole} />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};


// ─── 表示モード ───────────────────────────────────────────────────────────────

function ViewMode({
  foreigner,
  hasAdminDiff,
  diffKeys,
}: {
  foreigner: Foreigner;
  hasAdminDiff: boolean;
  diffKeys: (keyof Foreigner)[];
}) {
  const DIFF_LABEL: Partial<Record<keyof Foreigner, string>> = {
    name: '氏名',
    nationality: '国籍',
    birthDate: '生年月日',
    residenceCardNumber: '在留カード番号',
    expiryDate: '在留期限',
    email: 'メールアドレス',
    company: '所属機関',
    visaType: '在留資格種別',
    jobTitle: '職務内容',
    experience: '過去の経験・専門性',
    salary: '基本給 (月額)',
    allowances: '諸手当 (月額)',
    socialInsurance: '社会保険加入',
    housingProvided: '住宅の提供',
  };

  /** 差分値を人間が読める形式に変換 */
  function formatDiffValue(k: keyof Foreigner, val: unknown): string {
    if (val == null || val === '') return '未登録';
    if (k === 'salary' || k === 'allowances') return `¥${Number(val).toLocaleString()}`;
    if (k === 'socialInsurance') return val ? '加入' : '未加入';
    if (k === 'housingProvided') return val ? 'あり' : 'なし';
    return String(val);
  }


  return (
    <div className="space-y-12">
      {/* 本人申告情報 */}
      <section className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm space-y-8">
        <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-4">
          <UserCircle className="w-4 h-4" /> 本人申告の情報
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {([['氏名', foreigner.name], ['国籍', foreigner.nationality], ['生年月日', foreigner.birthDate], ['メールアドレス', foreigner.email ?? '未設定']] as [string, string][]).map(([lbl, val]) => (
            <div key={lbl} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{lbl}</p>
              <p className="text-base font-black text-slate-900">{val}</p>
            </div>
          ))}
        </div>
        <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-xs space-y-4">
          <Row label="在留期限" value={<span className="text-sm font-black text-rose-600">{foreigner.expiryDate}</span>} />
          <Row label="カード番号" value={<span className="text-sm font-black text-indigo-600 font-mono tracking-wider">{foreigner.residenceCardNumber}</span>} />
          <div className="flex justify-between items-center py-2">
            <span className="text-xs font-bold text-slate-400">提出書類</span>
            <div className="flex gap-2">
              {foreigner.passportImageUrl && <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-bold">パスポート</span>}
              {(foreigner.residenceCardFrontUrl || foreigner.residenceCardBackUrl) && <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-bold">在留カード</span>}
              {!foreigner.passportImageUrl && !foreigner.residenceCardFrontUrl && !foreigner.residenceCardBackUrl && <span className="text-[10px] text-slate-400">なし</span>}
            </div>
          </div>
        </div>

        {/* 書類プレビュー */}
        <div className="space-y-4 pt-2">
          <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> 提出書類のデジタルコピー
          </h5>
          <div className="grid grid-cols-3 gap-3">
            {[
              { url: foreigner.residenceCardFrontUrl, label: '在留カード(表)' },
              { url: foreigner.residenceCardBackUrl, label: '在留カード(裏)' },
              { url: foreigner.passportImageUrl, label: 'パスポート' },
            ].map(({ url, label }) =>
              url ? (
                <a key={label} href={url} target="_blank" rel="noopener noreferrer" className="aspect-3/2 bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center justify-center group cursor-pointer hover:bg-white hover:border-indigo-300 transition-all shadow-sm">
                  <FileText className="w-8 h-8 text-indigo-400 mb-2 group-hover:text-indigo-500 transition-colors" />
                  <span className="text-[9px] font-bold text-slate-600 group-hover:text-indigo-600 flex items-center gap-1">{label} <ExternalLink className="w-2.5 h-2.5" /></span>
                </a>
              ) : (
                <div key={label} className="aspect-3/2 bg-slate-50 border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-2">
                  <span className="text-[9px] font-bold text-slate-400">{label}未登録</span>
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* 初期提出データとの差分 */}
      {hasAdminDiff && foreigner.originalSubmittedData && (
        <section className="bg-amber-50/50 border border-amber-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4 text-amber-600">
              <Lock className="w-4 h-4" />
              <h3 className="text-sm font-bold">支部からの初回提出データ（修正前）</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {diffKeys.map(k =>
                foreigner.originalSubmittedData?.[k] !== foreigner[k] ? (
                  <div key={String(k)} className="bg-white/60 p-3 rounded-xl border border-amber-100">
                    <p className="text-[10px] font-bold text-amber-600/70 mb-1">{DIFF_LABEL[k] ?? String(k)}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-amber-900 line-through opacity-50">{formatDiffValue(k, foreigner.originalSubmittedData?.[k])}</p>
                      <span className="text-[10px] text-amber-500">→</span>
                      <p className="text-sm font-bold text-amber-900">{formatDiffValue(k, foreigner[k])}</p>
                    </div>
                  </div>
                ) : null
              )}
            </div>
            <p className="text-xs text-amber-700/60 mt-4 leading-relaxed bg-amber-100/30 p-3 rounded-lg border border-amber-100/50">
              ※このデータは、支部から最初に確認依頼が送信された時点の不可変なスナップショットです。
            </p>
          </div>
        </section>
      )}

      {/* 同意ログ */}
      {foreigner.consentLog && (
        <section className="space-y-4 pt-6 border-t border-slate-200 border-dashed">
          <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <Lock className="h-4 w-4 text-slate-500" />
            法的証拠ログ（電磁的同意記録）
          </h3>
          <div className="bg-slate-100/80 border border-slate-200 rounded-3xl p-6 shadow-inner">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InfoItem icon={Calendar} label="同意成立日時" value={formatAgreeDate(foreigner.consentLog.agreedAt)} />
              <InfoItem icon={Globe} label="送信元IPアドレス" value={foreigner.consentLog.ipAddress} />
              <div className="md:col-span-2">
                <div className="flex items-start gap-3 bg-white/50 p-4 rounded-xl border border-white">
                  <div className="p-2 bg-white rounded-lg border border-slate-100 shadow-sm">
                    <Monitor className="h-4 w-4 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">認証端末情報</p>
                    <p className="text-xs font-medium text-slate-600 mt-1 break-all leading-relaxed">{foreigner.consentLog.userAgent}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6">
            <ConsentPdfButton foreigner={foreigner} />
          </div>
        </section>
      )}

      {/* 受入・契約情報 */}
      <section className="space-y-6 pt-10 border-t border-slate-200">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2.5">
          <Building2 className="w-5 h-5 text-indigo-500" />
          受入・契約情報
          <span className="text-[10px] font-bold text-slate-400 ml-2 bg-slate-100 px-2 py-0.5 rounded">監理団体/支援機関入力</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <InfoCard label="所属機関" icon={<Building2 className="w-3 h-3" />} value={foreigner.company ?? '未登録'} />
          <InfoCard label="現在の在留資格" icon={<ClipboardList className="w-3 h-3" />} value={foreigner.visaType ?? '特定技能1号'} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">給与・諸手当</p>
            <div className="flex gap-8">
              {[['基本給', foreigner.salary], ['諸手当', foreigner.allowances]].map(([lbl, val]) => (
                <div key={String(lbl)}>
                  <p className="text-[10px] font-bold text-slate-400 mb-0.5">{lbl}</p>
                  <p className="text-lg font-black text-slate-900">{val ? `¥${Number(val).toLocaleString()}` : '-'}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">待遇・福利厚生</p>
            <div className="flex flex-wrap gap-2">
              <Badge active={!!foreigner.socialInsurance} trueColor="emerald" label={`社会保険：${foreigner.socialInsurance ? '加入' : '未加入'}`} />
              <Badge active={!!foreigner.housingProvided} trueColor="indigo" label={`住宅：${foreigner.housingProvided ? '提供あり' : 'なし'}`} />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-5">
          {[['職務内容 (予定)', foreigner.jobTitle ?? foreigner.aiReview?.jobTitle, 'indigo'], ['過去の経験・専門性', foreigner.experience ?? foreigner.aiReview?.pastExperience, 'slate']].map(([lbl, val, color]) => (
            <div key={String(lbl)} className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <span className={`w-2 h-2 rounded-full bg-${color}-${color === 'indigo' ? '500' : '300'} shadow-sm`} />
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{lbl}</p>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed font-medium">{val ?? '未登録'}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ─── 小コンポーネント ─────────────────────────────────────────────────────────

function InfoItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="p-2.5 bg-white rounded-xl border border-slate-100 shadow-sm shrink-0">
        <Icon className="h-4 w-4 text-slate-400" />
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-sm font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
}

function InfoCard({ label, icon, value }: { label: string; icon: React.ReactNode; value: string }) {
  return (
    <div className="group p-5 bg-indigo-50/40 border border-indigo-100 rounded-3xl hover:bg-indigo-50 transition-colors">
      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
        {icon} {label}
      </p>
      <p className="text-base font-black text-slate-800">{value}</p>
    </div>
  );
}

function Badge({ active, trueColor, label }: { active: boolean; trueColor: 'emerald' | 'indigo'; label: string }) {
  const on = active
    ? trueColor === 'emerald'
      ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
      : 'bg-indigo-50 border-indigo-100 text-indigo-700'
    : 'bg-slate-50 border-slate-100 text-slate-400';
  return <span className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-colors ${on}`}>{label}</span>;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-slate-50">
      <span className="text-xs font-bold text-slate-400">{label}</span>
      {value}
    </div>
  );
}
