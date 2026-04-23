'use client';

import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Building2, ChevronDown } from 'lucide-react';
import type { CompanyMaster } from '@/types/database';
import type { RenewalApplicationFormData } from '@/lib/schemas/renewalApplicationSchema';

interface CompanyMasterSelectorProps {
  companies: CompanyMaster[];
  loading?: boolean;
}

/**
 * CompanyMasterSelector
 *
 * 事前登録された企業マスタをプルダウンで選択し、
 * 「法人基本情報」「勤務事業所」フィールドへ一括自動入力するコンポーネント。
 * 選択後も各フィールドは手動編集が可能。
 */
export function CompanyMasterSelector({ companies, loading }: CompanyMasterSelectorProps) {
  const { setValue } = useFormContext<RenewalApplicationFormData>();
  const [selectedId, setSelectedId] = useState<string>('');

  const handleSelect = (id: string) => {
    setSelectedId(id);
    if (!id) return;

    const company = companies.find((c) => c.id === id);
    if (!company) return;

    // ─── 法人基本情報を一括セット ─────────────────────────────────────────
    setValue('employerInfo.companyNameJa', company.companyNameJa, { shouldDirty: true });
    setValue('employerInfo.hasCorporateNumber', company.hasCorporateNumber, { shouldDirty: true });
    if (company.corporateNumber) {
      setValue('employerInfo.corporateNumber', company.corporateNumber, { shouldDirty: true });
    }
    setValue('employerInfo.companyZipCode', company.companyZipCode, { shouldDirty: true });
    setValue('employerInfo.companyPref', company.companyPref, { shouldDirty: true });
    setValue('employerInfo.companyCity', company.companyCity, { shouldDirty: true });
    setValue('employerInfo.companyAddressLines', company.companyAddressLines, { shouldDirty: true });
    if (company.companyAddress) {
      setValue('employerInfo.companyAddress', company.companyAddress, { shouldDirty: true });
    }
    setValue('employerInfo.companyPhone', company.companyPhone, { shouldDirty: true });
    setValue('employerInfo.representativeName', company.representativeName, { shouldDirty: true });

    // ─── 任意の財務・規模情報 ──────────────────────────────────────────────
    if (company.employeeCount !== undefined) {
      setValue('employerInfo.employeeCount', company.employeeCount, { shouldDirty: true });
    }
    if (company.capital !== undefined) {
      setValue('employerInfo.capital', company.capital, { shouldDirty: true });
    }
    if (company.annualRevenue !== undefined) {
      setValue('employerInfo.annualRevenue', company.annualRevenue, { shouldDirty: true });
    }

    // ─── 勤務事業所情報（登録済みの場合のみ） ────────────────────────────
    if (company.workplaceName) {
      setValue('employerInfo.workplaceName', company.workplaceName, { shouldDirty: true });
    }
    if (company.workplaceZipCode) {
      setValue('employerInfo.workplaceZipCode', company.workplaceZipCode, { shouldDirty: true });
    }
    if (company.workplacePref) {
      setValue('employerInfo.workplacePref', company.workplacePref, { shouldDirty: true });
    }
    if (company.workplaceCity) {
      setValue('employerInfo.workplaceCity', company.workplaceCity, { shouldDirty: true });
    }
    if (company.workplaceAddressLines) {
      setValue('employerInfo.workplaceAddressLines', company.workplaceAddressLines, { shouldDirty: true });
    }

    // ─── 保険情報 ─────────────────────────────────────────────────────────
    if (company.isSocialInsuranceApplicable !== undefined) {
      setValue('employerInfo.isSocialInsuranceApplicable', company.isSocialInsuranceApplicable, { shouldDirty: true });
    }
    if (company.isLaborInsuranceApplicable !== undefined) {
      setValue('employerInfo.isLaborInsuranceApplicable', company.isLaborInsuranceApplicable, { shouldDirty: true });
    }
    if (company.laborInsuranceNumber) {
      setValue('employerInfo.laborInsuranceNumber', company.laborInsuranceNumber, { shouldDirty: true });
    }
    if (company.employmentInsuranceNumber) {
      setValue('employerInfo.employmentInsuranceNumber', company.employmentInsuranceNumber, { shouldDirty: true });
    }
  };

  if (companies.length === 0 && !loading) return null;

  return (
    <div className="company-master-selector">
      <div className="company-master-selector__header">
        <Building2 size={16} className="company-master-selector__icon" />
        <span className="company-master-selector__label">企業マスタから自動入力</span>
      </div>
      <div className="company-master-selector__body">
        <div className="company-master-selector__select-wrap">
          <select
            id="company-master-select"
            value={selectedId}
            onChange={(e) => handleSelect(e.target.value)}
            className="company-master-selector__select"
            disabled={loading}
          >
            <option value="">
              {loading ? '読み込み中...' : '企業を選択すると情報が自動入力されます'}
            </option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.companyNameJa}
              </option>
            ))}
          </select>
          <ChevronDown size={16} className="company-master-selector__chevron" />
        </div>
        {selectedId && (
          <p className="company-master-selector__hint">
            ✅ 情報を自動入力しました。内容を確認し、必要に応じて修正してください。
          </p>
        )}
      </div>
    </div>
  );
}
