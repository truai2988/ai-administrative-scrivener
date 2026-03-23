'use client';

import React, { useState, useEffect } from 'react';
import { differenceInDays, parseISO } from 'date-fns';
import { FileText, Save, CheckCircle, AlertCircle, Building2, Briefcase, CreditCard, ArrowLeft } from 'lucide-react';
import { foreignerService } from '@/services/foreignerService';
import { submitClientEditAction } from '@/app/actions/clientActions';
import { Foreigner } from '@/types/database';

interface ClientEditFormProps {
  foreignerId: string;
}

export const ClientEditForm: React.FC<ClientEditFormProps> = ({ foreignerId }) => {
  const [foreigner, setForeigner] = useState<Foreigner | null>(null);
  const [formData, setFormData] = useState({
    salary: '200000',
    allowances: '20000',
    contractPeriod: '12',
    jobRole: '飲食料品製造業',
    socialInsurance: true,
    housingProvided: true,
  });
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const data = await foreignerService.getForeignerById(foreignerId);
      if (data) {
        setForeigner(data);
        // AI Review 等から既存データがあればセット
        if (data.aiReview) {
          setFormData(prev => ({
            ...prev,
            salary: data.aiReview?.riskScore.toString() || '200000', // 仮の紐付け
            jobRole: data.aiReview?.jobTitle || prev.jobRole,
          }));
        }
      }
      setIsLoading(false);
    };
    fetchData();
  }, [foreignerId]);

  const calculateDaysUntilExpiry = (dateString: string) => {
    try {
      return differenceInDays(parseISO(dateString), new Date());
    } catch {
      return 0;
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    const result = await submitClientEditAction(foreignerId, {
      aiReview: {
        riskScore: parseInt(formData.salary) / 10000, // 仮の変換
        reason: '支援機関による追記完了',
        checkedAt: new Date().toISOString(),
        jobTitle: formData.jobRole,
        pastExperience: '',
      }
    });

    if (result.success) {
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } else {
      alert(result.error);
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">読み込み中...</div>;
  }

  if (!foreigner) {
    return <div className="flex items-center justify-center min-h-screen text-red-500">データが見つかりませんでした。</div>;
  }

  const daysUntilExpiry = calculateDaysUntilExpiry(foreigner.expiryDate);

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-50">
      {/* Left: Preview Section */}
      <div className="flex-1 lg:max-w-md bg-white border-r border-slate-200 overflow-y-auto max-h-screen p-6 sticky top-0">
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={() => window.location.href = '/'}
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-full shadow-sm transition-colors flex shrink-0"
            title="ダッシュボードへ戻る"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">本人入力内容のプレビュー</h2>
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded">本人確認済</span>
          </div>
        </div>

        <div className="space-y-8">
          {/* Basic Info */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-3.5 h-3.5" />
              基本情報
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-[10px] text-slate-500 mb-0.5">氏名</p>
                <p className="text-sm font-bold text-slate-800">{foreigner.name}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-[10px] text-slate-500 mb-0.5">国籍</p>
                <p className="text-sm font-bold text-slate-800">{foreigner.nationality}</p>
              </div>
            </div>
          </section>

          {/* Residence Info */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="w-3.5 h-3.5" />
              在留資格
            </h3>
            <div className="p-4 border border-slate-100 rounded-2xl space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-slate-50">
                <span className="text-xs text-slate-500">在留資格</span>
                <span className="text-sm font-bold text-slate-800">特定技能1号</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-50">
                <span className="text-xs text-slate-500">在留期限</span>
                <span className={`text-sm font-bold ${daysUntilExpiry < 30 ? 'text-red-600' : 'text-slate-800'}`}>
                  {foreigner.expiryDate} (あと{daysUntilExpiry}日)
                </span>
              </div>
            </div>
          </section>

          {/* Document Previews */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5" />
              提出書類
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="aspect-3/2 bg-slate-100 rounded-lg flex items-center justify-center border border-dashed border-slate-300 relative group overflow-hidden">
                <span className="text-[10px] text-slate-400 font-medium">在留カード(表)</span>
                <div className="absolute inset-0 bg-black/5 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <span className="px-2 py-1 bg-white text-slate-700 text-[10px] font-bold rounded-full shadow-sm">表示</span>
                </div>
              </div>
              <div className="aspect-3/2 bg-slate-100 rounded-lg flex items-center justify-center border border-dashed border-slate-300">
                <span className="text-[10px] text-slate-400 font-medium">在留カード(裏)</span>
              </div>
              <div className="aspect-3/2 bg-slate-100 rounded-lg flex items-center justify-center border border-dashed border-slate-300">
                <span className="text-[10px] text-slate-400 font-medium">パスポート</span>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Right: Input Section */}
      <div className="flex-1 p-8 lg:p-12">
        <div className="max-w-2xl mx-auto">
          <div className="mb-10">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">支援機関用 追記フォーム</h1>
            <p className="text-slate-500">
              雇用契約の内容や、会社側で管理する情報を補足してください。
            </p>
          </div>

          <div className="space-y-8 bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
            {/* Employment Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    基本給 (月額)
                  </div>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">¥</span>
                  <input
                    type="number"
                    className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  諸手当 (月額)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">¥</span>
                  <input
                    type="number"
                    className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={formData.allowances}
                    onChange={(e) => setFormData({ ...formData, allowances: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-indigo-600" />
                  従事業務内容
                </div>
              </label>
              <textarea
                rows={3}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="具体的に従事する業務の内容を記載してください"
                value={formData.jobRole}
                onChange={(e) => setFormData({ ...formData, jobRole: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl cursor-pointer hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  checked={formData.socialInsurance}
                  onChange={(e) => setFormData({ ...formData, socialInsurance: e.target.checked })}
                />
                <span className="text-sm font-medium text-slate-700">社会保険加入に同意</span>
              </label>
              <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl cursor-pointer hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  checked={formData.housingProvided}
                  onChange={(e) => setFormData({ ...formData, housingProvided: e.target.checked })}
                />
                <span className="text-sm font-medium text-slate-700">住宅の提供あり</span>
              </label>
            </div>

            <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-400 text-xs">
                <AlertCircle className="w-3.5 h-3.5" />
                全ての情報を入力すると「提出」が可能になります
              </div>
              <button
                onClick={handleSave}
                disabled={isSaved || isSaving}
                className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-bold transition-all ${
                  isSaved 
                    ? 'bg-emerald-500 text-white' 
                    : isSaving
                      ? 'bg-indigo-400 text-white cursor-wait'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100'
                }`}
              >
                {isSaved ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    保存済み
                  </>
                ) : (
                  <>
                    <Save className={isSaving ? "w-5 h-5 animate-spin" : "w-5 h-5"} />
                    {isSaving ? '保存中...' : '情報を確定して提出'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
