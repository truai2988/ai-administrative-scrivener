'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchDocumentTemplates } from '@/lib/api/templateAdminClient';
import type { DocumentTemplate } from '@/types/database';
import { formRegistry } from '@/components/forms/FormRendererWrapper';
import { FileText, FileSpreadsheet, Loader2, Search } from 'lucide-react';

interface TemplateSelectionClientProps {
  foreignerId?: string;
}

export function TemplateSelectionClient({ foreignerId }: TemplateSelectionClientProps) {
  const router = useRouter();
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadTemplates() {
      try {
        const data = await fetchDocumentTemplates();
        setTemplates(data);
      } catch (error) {
        console.error('Failed to fetch templates:', error);
      } finally {
        setLoading(false);
      }
    }
    loadTemplates();
  }, []);

  const handleTemplateClick = (template: DocumentTemplate) => {
    // formRegistryから合致するテンプレートを探す
    // formRegistryの各フォームの config.formName と一致するかチェック
    const registeredEntries = Object.entries(formRegistry);
    const matchedEntry = registeredEntries.find(
      ([_, registryData]) => registryData.config.formName === template.formName || registryData.config.formKey === template.formId
    );

    if (matchedEntry) {
      const englishId = matchedEntry[0];
      const url = `/applications/new/${englishId}${foreignerId ? `?foreignerId=${foreignerId}` : ''}`;
      router.push(url);
    } else {
      alert(`「${template.formName}」の入力フォームはまだシステムに生成されていません。CLIでスキーマを生成してください。`);
    }
  };

  const filteredTemplates = templates.filter(t => t.formName.includes(searchQuery));

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 検索バー */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-400" />
        </div>
        <input
          type="text"
          placeholder="書類名で検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
        />
      </div>

      {/* テンプレートグリッド */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <button
            key={template.id}
            onClick={() => handleTemplateClick(template)}
            className="group flex flex-col text-left bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg hover:border-indigo-200 transition-all duration-300"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-slate-50 group-hover:bg-indigo-50 rounded-xl transition-colors">
                <FileText className="w-6 h-6 text-slate-400 group-hover:text-indigo-500 transition-colors" />
              </div>
              
              {/* ファイルタイプバッジ */}
              <div className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg border ${
                template.fileType === 'excel' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                template.fileType === 'word' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                'bg-slate-50 text-slate-600 border-slate-200' // fallback (CSV if any)
              }`}>
                {template.fileType}
              </div>
            </div>

            <h3 className="text-base font-bold text-slate-800 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors">
              {template.formName}
            </h3>
          </button>
        ))}

        {filteredTemplates.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500">
            一致するテンプレートが見つかりませんでした。
          </div>
        )}
      </div>
    </div>
  );
}
