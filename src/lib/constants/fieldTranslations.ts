export const FIELD_TRANSLATIONS: Record<string, string> = {
  // --- 外国人本人情報 (foreignerInfo) ---
  'foreignerInfo.nationality': '[外国人情報] 国籍・地域',
  'foreignerInfo.birthDate': '[外国人情報] 生年月日',
  'foreignerInfo.nameEn': '[外国人情報] 氏名（英字）',
  'foreignerInfo.nameKanji': '[外国人情報] 氏名（漢字）',
  'foreignerInfo.gender': '[外国人情報] 性別',
  'foreignerInfo.maritalStatus': '[外国人情報] 配偶者の有無',
  'foreignerInfo.occupation': '[外国人情報] 職業',
  'foreignerInfo.homeCountryAddress': '[外国人情報] 本国における居住地',
  'foreignerInfo.japanZipCode': '[外国人情報] 日本の郵便番号',
  'foreignerInfo.japanPrefecture': '[外国人情報] 日本の都道府県',
  'foreignerInfo.japanCity': '[外国人情報] 日本の市区町村',
  'foreignerInfo.japanAddressLines': '[外国人情報] 日本の番地',
  'foreignerInfo.japanAddress': '[外国人情報] 日本の住所（マンション名等）',
  'foreignerInfo.phoneNumber': '[外国人情報] 電話番号',
  'foreignerInfo.mobileNumber': '[外国人情報] 携帯電話番号',
  'foreignerInfo.email': '[外国人情報] メールアドレス',
  'foreignerInfo.passportNumber': '[外国人情報] 旅券番号',
  'foreignerInfo.passportExpiryDate': '[外国人情報] 旅券有効期限',
  'foreignerInfo.currentResidenceStatus': '[外国人情報] 現に有する在留資格',
  'foreignerInfo.currentStayPeriod': '[外国人情報] 在留期間',
  'foreignerInfo.stayExpiryDate': '[外国人情報] 在留期間の満了日',
  'foreignerInfo.hasResidenceCard': '[外国人情報] 在留カードの有無',
  'foreignerInfo.residenceCardNumber': '[外国人情報] 在留カード番号',
  'foreignerInfo.desiredStayPeriod': '[外国人情報] 希望する在留期間',
  'foreignerInfo.renewalReason': '[外国人情報] 更新の理由',
  'foreignerInfo.criminalRecord': '[外国人情報] 犯罪を理由とする処罰の有無',
  'foreignerInfo.specificSkillCategory': '[外国人情報] 特定産業分野',
  'foreignerInfo.hasRelatives': '[外国人情報] 在日親族等の有無',

  // --- 所属機関（企業）情報 (employerInfo) ---
  'employerInfo.contractStartDate': '[企業情報] 雇用契約開始日',
  'employerInfo.contractEndDate': '[企業情報] 雇用契約終了日',
  'employerInfo.industryFields': '[企業情報] 産業分類',
  'employerInfo.jobCategories': '[企業情報] 職業分類',
  'employerInfo.mainJobType': '[企業情報] 従事する主な業務内容',
  'employerInfo.weeklyWorkHours': '[企業情報] 週間の労働時間',
  'employerInfo.monthlyWorkHours': '[企業情報] 月間の労働時間',
  'employerInfo.monthlySalary': '[企業情報] 報酬月額（基本給）',
  'employerInfo.hourlyRate': '[企業情報] 時給換算額',
  'employerInfo.equivalentSalary': '[企業情報] 日本人と同等以上の報酬水準か',
  'employerInfo.paymentMethod': '[企業情報] 報酬の支払方法',
  'employerInfo.companyNameJa': '[企業情報] 企業名',
  'employerInfo.corporateNumber': '[企業情報] 法人番号',
  'employerInfo.employmentInsuranceNumber': '[企業情報] 雇用保険適用事業所番号',
  'employerInfo.companyZipCode': '[企業情報] 本店郵便番号',
  'employerInfo.companyPref': '[企業情報] 本店都道府県',
  'employerInfo.companyCity': '[企業情報] 本店市区町村',
  'employerInfo.representativeName': '[企業情報] 代表者氏名',
  'employerInfo.companyPhone': '[企業情報] 本店電話番号',
  'employerInfo.capital': '[企業情報] 資本金',
  'employerInfo.annualRevenue': '[企業情報] 直近の年間売上高',
  'employerInfo.employeeCount': '[企業情報] 従業員数',
  'employerInfo.workplaceName': '[企業情報] 就業場所の名称',
  'employerInfo.isSocialInsuranceApplicable': '[企業情報] 社会保険の適用状況',
  'employerInfo.isLaborInsuranceApplicable': '[企業情報] 労働保険の適用状況',
  'employerInfo.laborInsuranceNumber': '[企業情報] 労働保険番号',
  'employerInfo.hasJobHistory': '[企業情報] 過去の雇用実績の有無',

  // --- 同時申請 (simultaneousApplication) ---
  'simultaneousApplication.applyForReEntry': '[同時申請] 再入国許可',
  'simultaneousApplication.applyForActivityOutsideStatus': '[同時申請] 資格外活動許可',
  'simultaneousApplication.applyForAuthEmployment': '[同時申請] 就労資格証明書',
};

/**
 * AI診断のフィールドパスから、該当するタブ名（大項目）を日本語で返します。
 * パンくずリスト（詳細なフィールド名）は表示せず、タブ名のみを返します。
 */
export function translateFieldPath(fieldPath: string): string {
  const rootKey = fieldPath.split('.')[0];
  
  const rootTranslations: Record<string, string> = {
    foreignerInfo: '外国人本人',
    employerInfo: '所属機関等',
    employmentInfo: '所属機関等', // AIのハルシネーション対策
    companyInfo: '所属機関等', // AIのハルシネーション対策
    simultaneousApplication: '同時申請',
    identityInfo: '申請人等(1)',
    applicantSpecificInfo: '申請人等(2)',
    legalRepresentative: '法定代理人',
    agencyRep: '取次者',
    residenceCardReceiptMethod: '申請メタデータ',
    checkIntent: '申請メタデータ',
    freeFormat: '申請メタデータ',
    notificationEmail: '申請メタデータ',
    assignments: '担当者',
  };

  return rootTranslations[rootKey] || '全体項目';
}
