/**
 * foreignerToFormData.ts
 * foreigners コレクションのプロフィールデータを
 * RenewalApplicationFormData の形にマッピングする純粋関数
 *
 * ここが唯一の「Foreigner → 申請書フォーム」変換レイヤー。
 * 仕様変更時はここだけを修正する。
 */
import type { Foreigner } from '@/types/database';
import type { RenewalApplicationFormData } from '@/lib/schemas/renewalApplicationSchema';

/**
 * Foreigner プロフィールから申請フォームの初期値（部分）を生成する
 *
 * フォールバック用途のため、必須フィールドは空文字/デフォルト値で埋める。
 * 実際の保存はフォームバリデーション通過後に行われるので問題ない。
 */
export function mapForeignerProfileToFormData(
  profile: Foreigner
): Partial<RenewalApplicationFormData> {

  // 性別変換: '男'→'male', '女'→'female', それ以外は'male'をデフォルトに
  const genderMapped = profile.gender === '女' ? 'female' : 'male';

  // 住所: japanAddress をそのまま保持しつつ、分割フィールドは空欄（手動確認を促す）
  const japanAddress = profile.address || '';

  // 給与: 数値として保持（文字列の場合はparseFloat）
  const monthlySalary = profile.salary
    ? (typeof profile.salary === 'number' ? profile.salary : parseFloat(profile.salary) || 180000)
    : 180000;

  return {
    foreignerInfo: {
      // ── 台帳から引き継ぐ項目 ──
      nationality:            profile.nationality          || '',
      birthDate:              profile.birthDate            || '',
      nameEn:                 profile.name                 || '',
      residenceCardNumber:    profile.residenceCardNumber  || '',
      currentResidenceStatus: profile.visaType             || '',
      stayExpiryDate:         profile.expiryDate           || '',
      occupation:             profile.jobTitle             || '',
      email:                  profile.email                || '',
      passportNumber:         profile.passportNumber       || '',
      currentStayPeriod:      profile.periodOfStay         || '',
      gender:                 genderMapped,
      japanAddress:           japanAddress,

      // ── 必須フィールドをデフォルト値で補完 ──
      nameKanji:              '',
      maritalStatus:          'unmarried',
      homeCountryAddress:     '',
      japanZipCode:           '',
      japanPrefecture:        '',
      japanCity:              '',
      japanAddressLines:      '',
      phoneNumber:            '',
      mobileNumber:           '',
      passportExpiryDate:     '',
      edNumberAlpha:          '',
      edNumberNumeric:        '',
      hasResidenceCard:       true,
      desiredStayPeriod:      '1year',
      desiredStayPeriodOther: '',
      renewalReason:          '',
      criminalRecord:         false,
      criminalRecordDetail:   '',
      specificSkillCategory:  '1',
      skillCertifications:    [],
      languageCertifications: [],
      otherSkillCert:         '',
      otherLanguageCert:      '',
      totalSpecificSkillStayYears:  0,
      totalSpecificSkillStayMonths: 0,
      depositCharged:              false,
      depositOrganizationName:     '',
      depositAmount:               0,
      feeCharged:                  false,
      foreignOrganizationName:     '',
      feeAmount:                   0,
      hasRelatives:                false,
      relatives:                   [],
      residenceCardReceiptMethod:  'window',
      applicantResidencePlace:     '',
      receivingOffice:             '',
      notificationEmail:           '',
      checkIntent:                 false,
      freeFormat:                  '',
    } as RenewalApplicationFormData['foreignerInfo'],

    employerInfo: {
      // ── 台帳から引き継ぐ項目 ──
      companyNameJa:              profile.company              || '',
      monthlySalary:              monthlySalary,
      isSocialInsuranceApplicable: profile.socialInsurance     ?? true,
      isLaborInsuranceApplicable:  true,

      // ── 必須フィールドをデフォルト値で補完 ──
      contractStartDate:          '',
      contractEndDate:            '',
      industryFields:             [],
      jobCategories:              [],
      mainJobType:                '',
      otherJobTypes:              [],
      weeklyWorkHours:            40,
      monthlyWorkHours:           173,
      equivalentWorkHours:        true,
      hourlyRate:                 1039,
      japaneseMonthlySalary:      monthlySalary,
      equivalentSalary:           true,
      paymentMethod:              'bank_transfer',
      hasDifferentTreatment:      false,
      differentTreatmentDetail:   '',
      hasCorporateNumber:         true,
      corporateNumber:            '',
      employmentInsuranceNumber:  '',
      companyZipCode:             '',
      companyPref:                '',
      companyCity:                '',
      companyAddressLines:        '',
      companyAddress:             '',
      representativeName:         '',
      companyPhone:               '',
      capital:                    undefined,
      annualRevenue:              undefined,
      employeeCount:              1,
      workplaceName:              '',
      workplaceZipCode:           '',
      workplacePref:              '',
      workplaceCity:              '',
      workplaceAddressLines:      '',
      laborInsuranceNumber:       '',
      hasJobHistory:              false,
      jobHistory:                 [],
      complianceOaths: {
        hadLaborLawPenalty:  false,
        hadIllegalDismissal: false,
        hadMissingPersons:   false,
      },
      delegateSupportEntirely:        false,
      supportAgencyName:              '',
      supportAgencyRegistrationNumber: '',
      supportPersonnel: {
        supervisorName:  '',
        supervisorTitle: '',
        officerName:     '',
        officerTitle:    '',
      },
    },
  };
}
