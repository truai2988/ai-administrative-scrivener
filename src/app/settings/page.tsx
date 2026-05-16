'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Settings, Save, Loader2, ArrowLeft, ShieldAlert, UserCircle } from 'lucide-react';
import {
  getAssignmentTemplates,
  saveAssignmentTemplates,
  type ApplicationKind,
  type TabAssignmentTemplate,
  type DefaultAssignmentRole
} from '@/lib/constants/assignmentTemplates';
import { ToastContainer, useToast } from '@/components/ui/Toast';
import { USER_ROLE_LABELS, type User } from '@/types/database';
import Link from 'next/link';
import { foreignerService } from '@/services/foreignerService';

/** 担当者アサインに使用するロール（行政書士・本部管理者は除外） */
const ASSIGNABLE_ROLES: { role: string; label: string }[] = [
  { role: 'union_staff', label: USER_ROLE_LABELS.union_staff },
  { role: 'enterprise_staff', label: USER_ROLE_LABELS.enterprise_staff },
];

/** 申請種別ごとのタブラベルマッピング（設定画面表示用） */
const TAB_LABEL_MAP: Record<string, string> = {
  // renewal / change
  foreigner: '外国人本人情報',
  employer: '所属機関（企業）情報',
  simultaneous: '同時申請',
  // certification (COE)
  identity: '身分事項',
  applicant: '申請人情報',
  representative: '代理人・取次者',
  metadata: '申請メタデータ',
};

export default function SettingsPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toasts, dismiss, show: showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState<Record<ApplicationKind, TabAssignmentTemplate> | null>(null);
  const [activeTemplateTab, setActiveTemplateTab] = useState<ApplicationKind | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!currentUser) {
      router.push('/login');
      return;
    }
    // 行政書士（Scrivener）チェック
    if (currentUser.role !== 'scrivener') {
      showToast('error', '権限がありません');
      setTimeout(() => router.push('/'), 1500);
      return;
    }

    const loadData = async () => {
      try {
        const data = await getAssignmentTemplates();
        setTemplates(data);
        const keys = Object.keys(data) as ApplicationKind[];
        if (keys.length > 0) {
          setActiveTemplateTab(keys[0]);
        }
      } catch (err) {
        console.error('[Settings] Load error:', err);
        showToast('error', '設定の読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [currentUser, authLoading, router, showToast]);

  const handleRoleChange = (kind: ApplicationKind, tabId: string, role: string) => {
    if (!templates) return;
    const newRole = role === '' ? null : (role as DefaultAssignmentRole);
    setTemplates({
      ...templates,
      [kind]: {
        ...templates[kind],
        roles: {
          ...templates[kind].roles,
          [tabId]: newRole,
        },
      },
    });
  };

  const handleSave = async () => {
    if (!templates) return;
    setSaving(true);
    try {
      await saveAssignmentTemplates(templates);
      showToast('success', '担当者アサインテンプレートを保存しました');
    } catch (err) {
      console.error('[Settings] Save error:', err);
      showToast('error', '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  if (loading || authLoading || !currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!templates) return null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      {/* ─── ヘッダー ────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-xs">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
            <Link
              href="/"
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Settings size={22} className="text-indigo-600" />
                設定
              </h1>
              <p className="text-xs text-slate-500 mt-1 font-medium">申請フローや業務ルールのカスタマイズ</p>
            </div>
        </div>
      </header>

      {/* ─── メインコンテンツ ─────────────────────────────────────────────────── */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <ShieldAlert size={18} className="text-slate-400" />
              自動担当者アサイン（テンプレート設定）
            </h2>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              申請書を新規作成する際、どのタブをどのロール（役割）のユーザーにデフォルトで割り当てるかを設定します。
              各申請書のエディタ画面から個別に手動上書きすることも可能です。
            </p>
          </div>

          <div className="border-b border-slate-200">
            <div className="flex overflow-x-auto">
              {(Object.keys(templates) as ApplicationKind[]).map((kind) => (
                <button
                  key={kind}
                  onClick={() => setActiveTemplateTab(kind)}
                  className={`px-6 py-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
                    activeTemplateTab === kind
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {templates[kind].description}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {activeTemplateTab && templates[activeTemplateTab] && (
              <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                <h3 className="text-md font-bold mb-4 text-slate-700 flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-indigo-500 rounded-full inline-block"></span>
                  {templates[activeTemplateTab].description} の担当者
                </h3>
                <div className="space-y-4">
                  {Object.keys(templates[activeTemplateTab].roles).map((tabId) => (
                    <div key={tabId} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-white rounded-lg border border-slate-200">
                      <label className="text-sm font-bold text-slate-600 min-w-[180px]">
                        {TAB_LABEL_MAP[tabId] || tabId}
                      </label>
                      <select
                        value={templates[activeTemplateTab].roles[tabId] ?? ''}
                        onChange={(e) => handleRoleChange(activeTemplateTab, tabId, e.target.value)}
                        className="flex-1 max-w-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                      >
                        <option value="">行政書士</option>
                        {ASSIGNABLE_ROLES.map(({ role, label }) => (
                          <option key={role} value={role}>
                            {label} ({role})
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>

                {/* ─── 保存ボタン（アサインテンプレート専用） ─── */}
                <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-sm"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    担当者設定を保存
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>





        {/* ─── プロフィール設定への導線 ─── */}
        <div className="mt-6 bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <UserCircle size={18} className="text-indigo-500" />
              プロフィール設定
            </h2>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              ユーザー名や連絡先、パスワードなどのアカウント基本情報を確認・変更できます。
            </p>
          </div>
          <div className="p-6">
            <Link
              href="/settings/profile"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl font-bold text-sm hover:bg-indigo-100 transition-colors"
            >
              <UserCircle size={16} />
              プロフィール設定を開く
            </Link>
          </div>
        </div>

        {/* ─── システムメンテナンス ─── */}
        <div className="mt-6 bg-white rounded-2xl shadow-xs border border-rose-200 overflow-hidden">
          <div className="p-6 border-b border-rose-100 bg-rose-50/30">
            <h2 className="text-lg font-bold flex items-center gap-2 text-rose-600">
              <ShieldAlert size={18} />
              システムメンテナンス
            </h2>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              データベースの不整合や表示のズレが発生した場合の強制リセットツールです。
            </p>
          </div>
          <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-700">ダッシュボード数値の再集計</h3>
                <p className="text-xs text-slate-500 mt-1">
                  一覧画面上部のタブ（進行中の申請、完了など）の数字が実際のリスト件数と合わない場合、このボタンを押して全データを数え直してください。
                </p>
              </div>
              <RecalculateButton showToast={showToast} />
            </div>

          </div>
        </div>
      </main>

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}

function RecalculateButton({ showToast }: { showToast: (type: 'success'|'error', msg: string) => void }) {
  const [loading, setLoading] = useState(false);
  return (
    <button
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        try {
          const res = await fetch('/api/admin/recalculate-stats', { method: 'POST' });
          if (!res.ok) throw new Error('API Error');
          showToast('success', '再集計が完了しました。画面を更新すると反映されます。');
        } catch (err) {
          console.error(err);
          showToast('error', '再集計に失敗しました');
        } finally {
          setLoading(false);
        }
      }}
      className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl font-bold text-sm hover:bg-rose-100 transition-colors disabled:opacity-50"
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : <ShieldAlert size={16} />}
      再集計を実行
    </button>
  );
}
