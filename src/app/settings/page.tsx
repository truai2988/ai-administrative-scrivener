'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Settings, Save, Loader2, ArrowLeft, ShieldAlert } from 'lucide-react';
import {
  getAssignmentTemplates,
  saveAssignmentTemplates,
  type ApplicationKind,
  type TabAssignmentTemplate,
  type DefaultAssignmentRole
} from '@/lib/constants/assignmentTemplates';
import type { TabId } from '@/lib/schemas/renewalApplicationSchema';
import { ToastContainer, useToast } from '@/components/ui/Toast';
import { TEST_USERS } from '@/lib/constants/testUsers';
import Link from 'next/link';

const TAB_LABELS: Record<TabId, string> = {
  foreigner: '外国人本人情報',
  employer: '所属機関（企業）情報',
  simultaneous: '同時申請',
};

const TAB_IDS: TabId[] = ['foreigner', 'employer', 'simultaneous'];

export default function SettingsPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toasts, dismiss, show: showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState<Record<ApplicationKind, TabAssignmentTemplate> | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!currentUser) {
      router.push('/login');
      return;
    }
    // 行政書士（Scrivener）チェック（今回は簡易的にロールで判定）
    if (currentUser.role !== 'scrivener' && currentUser.role !== 'hq_admin') {
      showToast('error', '権限がありません');
      setTimeout(() => router.push('/'), 1500);
      return;
    }

    const loadData = async () => {
      try {
        const data = await getAssignmentTemplates();
        setTemplates(data);
      } catch (err) {
        console.error('[Settings] Load error:', err);
        showToast('error', '設定の読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [currentUser, authLoading, router, showToast]);

  const handleRoleChange = (kind: ApplicationKind, tabId: TabId, role: string) => {
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

  if (loading || authLoading) {
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
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Settings size={22} className="text-indigo-600" />
                システム設定
              </h1>
              <p className="text-xs text-slate-500 mt-1 font-medium">申請フローや業務ルールのカスタマイズ</p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-sm"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            設定を保存する
          </button>
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

          <div className="p-6 space-y-8">
            {(Object.keys(templates) as ApplicationKind[]).map((kind) => {
              const tmpl = templates[kind];
              return (
                <div key={kind} className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                  <h3 className="text-md font-bold mb-4 text-slate-700 flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-indigo-500 rounded-full inline-block"></span>
                    {tmpl.description}
                  </h3>
                  <div className="space-y-4">
                    {TAB_IDS.map((tabId) => (
                      <div key={tabId} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-white rounded-lg border border-slate-200">
                        <label className="text-sm font-bold text-slate-600 min-w-[180px]">
                          {TAB_LABELS[tabId]}
                        </label>
                        <select
                          value={tmpl.roles[tabId] ?? ''}
                          onChange={(e) => handleRoleChange(kind, tabId, e.target.value)}
                          className="flex-1 max-w-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                        >
                          <option value="">担当者なし（行政書士のみ）</option>
                          {/* 重複を省いたロール一覧をダミーユーザーから生成 */}
                          {[...new Set(TEST_USERS.filter(u => !u.isAdmin).map(u => u.role))].map((roleVal) => {
                            const label = roleVal === 'branch_staff' ? '支部事務員' : roleVal === 'enterprise_staff' ? '企業担当者' : roleVal;
                            return (
                              <option key={roleVal} value={roleVal}>{label} ({roleVal})</option>
                            );
                          })}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
