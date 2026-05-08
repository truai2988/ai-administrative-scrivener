'use client';

import React, { useState } from 'react';
import { AiExtractionSidebar, type AiExtractionSidebarProps } from '@/components/AiExtractionSidebar';
import { AiDiagnosticPanel, type AiDiagnosticPanelProps } from '@/components/forms/AiDiagnosticPanel';
import { FileSearch, Sparkles } from 'lucide-react';

interface AiAssistantSidePanelProps {
  extractionProps?: Omit<AiExtractionSidebarProps, 'isOpen' | 'onToggle' | 'hideHeader'>;
  diagnosticProps: AiDiagnosticPanelProps;
}

export function AiAssistantSidePanel({ extractionProps, diagnosticProps }: AiAssistantSidePanelProps) {
  const [activeTab, setActiveTab] = useState<'extraction' | 'diagnostic'>(extractionProps ? 'extraction' : 'diagnostic');

  const showTabs = !!extractionProps;

  return (
    <div className="form-side-panel">
      {/* 共通タブナビゲーション */}
      {showTabs && (
        <div className="flex bg-slate-900/60 p-1 rounded-xl mb-4 border border-slate-700/50">
          <button
          type="button"
          onClick={() => setActiveTab('extraction')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg transition-all duration-200 ${
            activeTab === 'extraction' 
              ? 'bg-slate-800 text-indigo-400 shadow-sm border border-indigo-500/30 shadow-indigo-500/10' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-transparent'
          }`}
        >
          <FileSearch size={16} />
          書類から自動入力
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('diagnostic')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg transition-all duration-200 ${
            activeTab === 'diagnostic' 
              ? 'bg-slate-800 text-purple-400 shadow-sm border border-purple-500/30 shadow-purple-500/10' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-transparent'
          }`}
        >
          <Sparkles size={16} />
          AI診断
        </button>
        </div>
      )}

      {/* コンテンツエリア */}
      <div className="flex-1 min-h-0">
        {activeTab === 'extraction' && extractionProps && (
          <AiExtractionSidebar 
            {...extractionProps} 
            isOpen={true} 
            onToggle={() => {}} 
            hideHeader={true} 
          />
        )}
        {activeTab === 'diagnostic' && (
          <AiDiagnosticPanel {...diagnosticProps} />
        )}
      </div>
    </div>
  );
}
