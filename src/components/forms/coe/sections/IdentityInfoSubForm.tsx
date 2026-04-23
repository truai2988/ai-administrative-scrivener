'use client';

import React from 'react';
import { BasicProfileFields } from './identity/BasicProfileFields';
import { ContactInfoFields } from './identity/ContactInfoFields';
import { PassportAndEntryFields } from './identity/PassportAndEntryFields';
import { RelativeListFields } from './identity/RelativeListFields';

export function IdentityInfoSubForm() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="subsection">
        <h3 className="subsection-title">基本情報</h3>
        <BasicProfileFields />
      </div>

      <div className="subsection">
        <h3 className="subsection-title">日本における連絡先</h3>
        <ContactInfoFields />
      </div>

      <div className="subsection">
        <h3 className="subsection-title">旅券・入国情報・履歴</h3>
        <PassportAndEntryFields />
      </div>

      <div className="subsection">
        <h3 className="subsection-title">在日親族及び同居者</h3>
        <RelativeListFields />
      </div>
    </div>
  );
}
