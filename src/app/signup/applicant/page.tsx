import React from 'react';
import { ApplicantRegistrationWizard } from '@/components/applicant/ApplicantRegistrationWizard';

export default async function ApplicantSignupPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams;
  const token = typeof sp.token === 'string' ? sp.token : (typeof sp.unionId === 'string' ? sp.unionId : undefined);

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-5">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-rose-100 max-w-sm w-full text-center space-y-3">
          <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-2">
            <span className="text-rose-500 text-xl font-black">!</span>
          </div>
          <h1 className="text-lg font-black text-slate-900">エラー (Error)</h1>
          <p className="text-sm font-medium text-slate-500 leading-relaxed">
            招待リンクが正しくありません。<br />
            (Invalid invitation link)
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <ApplicantRegistrationWizard token={token} />
    </main>
  );
}
