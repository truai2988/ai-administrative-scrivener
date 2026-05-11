'use client';

import React from 'react';
import { AiExtractionSidebar, type AiExtractionSidebarProps } from '@/components/AiExtractionSidebar';
import { AiDiagnosticPanel, type AiDiagnosticPanelProps } from '@/components/forms/AiDiagnosticPanel';
import { FileSearch } from 'lucide-react';

interface AiAssistantSidePanelProps {
  extractionProps?: Omit<AiExtractionSidebarProps, 'isOpen' | 'onToggle' | 'hideHeader'>;
  diagnosticProps: AiDiagnosticPanelProps;
}

export function AiAssistantSidePanel({ extractionProps, diagnosticProps }: AiAssistantSidePanelProps) {
  return (
    <div className="form-side-panel flex flex-col h-full bg-slate-900">


      <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-6">
        {extractionProps && (
          <div className="flex flex-col">
            <h3 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
              <FileSearch size={16} className="text-indigo-400" />
              書類から自動入力
            </h3>
            <AiExtractionSidebar 
              {...extractionProps} 
              isOpen={true} 
              onToggle={() => {}} 
              hideHeader={true} 
            />
          </div>
        )}
        
        <div className="flex flex-col">
          <AiDiagnosticPanel {...diagnosticProps} />
        </div>
      </div>
    </div>
  );
}
