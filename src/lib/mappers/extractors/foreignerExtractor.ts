/**
 * foreignerExtractor.ts
 *
 * Document AI の出力から「外国人本人情報（foreignerInfo）」を抽出するロジック。
 *
 * ■ 責務
 *   - Entity ベース抽出（Custom Extractor / Named Entity Extractor 向け）
 *   - 正規表現ベース抽出（汎用 Document OCR テキスト向け）
 *
 * ■ 将来の拡張ポイント（TODO）
 *   下記の項目は現在未実装。Document AI の精度向上 / 追加ドキュメント対応時に
 *   このファイルに追記すること。
 *
 *   TODO: occupation（職業）の抽出
 *   TODO: homeCountryAddress（本国居住地）の抽出
 *   TODO: japanZipCode / japanPrefecture / japanCity / japanAddressLines（住所分割）
 *   TODO: phoneNumber / mobileNumber の抽出
 *   TODO: email の抽出
 *   TODO: passportExpiryDate（旅券有効期限）の抽出
 *   TODO: edNumberAlpha / edNumberNumeric（ED番号 英字4桁+数字7桁）の抽出
 *   TODO: currentStayPeriod（在留期間）の抽出
 *   TODO: desiredStayPeriod（希望する在留期間）の抽出
 *   TODO: renewalReason（更新の理由）の抽出
 *   TODO: totalSpecificSkillStayYears / Months（特定技能1号通算在留期間）の抽出
 *   TODO: depositCharged / feeCharged（保証金・費用）の抽出
 *   TODO: hasRelatives / relatives[]（在日親族・同居者）の抽出
 *   TODO: skillCertifications / languageCertifications（技能・日本語証明）の抽出
 */

import type { RenewalApplicationFormData } from '@/lib/schemas/renewalApplicationSchema';
import type { protos } from '@google-cloud/documentai';
import {
  normalizeDate,
  normalizeResidenceCardNumber,
  normalizePassportNumber,
} from '../normalizers/dateNormalizer';
import { splitJapanAddress } from '../normalizers/addressNormalizer';
import type { OcrExtractedField } from '../aiExtractedToFormData';

type IEntity = protos.google.cloud.documentai.v1.Document.IEntity;
type ForeignerFormData = Partial<RenewalApplicationFormData['foreignerInfo']>;

// ─── ヘルパー ────────────────────────────────────────────────────────────────

/**
 * OcrExtractedField 配列にフィールドを追加する。
 * 同一 fieldPath が既に存在する場合、信頼度が高い方を優先する。
 */
function pushField(
  fields: OcrExtractedField[],
  fieldPath: string,
  rawValue: string,
  normalizedValue: string,
  confidence: number
): void {
  const existing = fields.find(f => f.fieldPath === fieldPath);
  if (existing) {
    if (confidence > existing.confidence) {
      existing.rawValue = rawValue;
      existing.normalizedValue = normalizedValue;
      existing.confidence = confidence;
    }
    return;
  }
  fields.push({ fieldPath, rawValue, normalizedValue, confidence });
}

// ─── Entity ベース抽出 ────────────────────────────────────────────────────────

/**
 * Document AI の entities 配列から foreignerInfo フィールドを抽出する。
 * Custom Extractor / Named Entity Extractor の出力に対応。
 */
export function extractForeignerFromEntities(
  entities: IEntity[],
  formData: ForeignerFormData,
  fields: OcrExtractedField[]
): void {
  for (const entity of entities) {
    const type = entity.type ?? '';
    const raw  = entity.mentionText ?? entity.normalizedValue?.text ?? '';
    const conf = entity.confidence ?? 0;

    switch (type.toLowerCase()) {
      case 'given-name':
      case 'first-name':
      case 'given_name': {
        const current = formData.nameEn ?? '';
        formData.nameEn = current ? `${raw.trim()} ${current}` : raw.trim();
        pushField(fields, 'foreignerInfo.nameEn', raw, formData.nameEn, conf);
        break;
      }
      case 'family-name':
      case 'last-name':
      case 'family_name': {
        const current = formData.nameEn ?? '';
        formData.nameEn = current ? `${current} ${raw.trim()}` : raw.trim();
        pushField(fields, 'foreignerInfo.nameEn', raw, formData.nameEn, conf);
        break;
      }
      case 'name':
      case 'full-name':
      case 'full_name': {
        formData.nameEn = raw.trim();
        pushField(fields, 'foreignerInfo.nameEn', raw, raw.trim(), conf);
        break;
      }
      case 'date-of-birth':
      case 'birth_date':
      case 'birthday': {
        const normalized = normalizeDate(raw);
        if (normalized) {
          formData.birthDate = normalized;
          pushField(fields, 'foreignerInfo.birthDate', raw, normalized, conf);
        }
        break;
      }
      case 'nationality':
      case 'country': {
        formData.nationality = raw.trim();
        pushField(fields, 'foreignerInfo.nationality', raw, raw.trim(), conf);
        break;
      }
      case 'document-id':
      case 'card_number':
      case 'residence_card_number': {
        const normalized = normalizeResidenceCardNumber(raw);
        if (normalized) {
          formData.residenceCardNumber = normalized;
          pushField(fields, 'foreignerInfo.residenceCardNumber', raw, normalized, conf);
          
          if (formData.hasResidenceCard === undefined || formData.hasResidenceCard === null) {
            formData.hasResidenceCard = true;
            pushField(fields, 'foreignerInfo.hasResidenceCard', raw, 'true', conf);
          }
        }
        break;
      }
      case 'expiration-date':
      case 'expiry_date':
      case 'expiration_date': {
        const normalized = normalizeDate(raw);
        if (normalized) {
          formData.stayExpiryDate = normalized;
          pushField(fields, 'foreignerInfo.stayExpiryDate', raw, normalized, conf);
        }
        break;
      }
      case 'passport-number':
      case 'passport_number': {
        const normalized = normalizePassportNumber(raw);
        if (normalized) {
          formData.passportNumber = normalized;
          pushField(fields, 'foreignerInfo.passportNumber', raw, normalized, conf);
        }
        break;
      }
      case 'gender':
      case 'sex': {
        const valLower = raw.trim().toLowerCase();
        let genderVal: 'male' | 'female' | undefined;
        if (valLower.includes('男') || valLower.includes('m')) genderVal = 'male';
        else if (valLower.includes('女') || valLower.includes('f')) genderVal = 'female';
        
        if (genderVal && !formData.gender) {
          formData.gender = genderVal;
          pushField(fields, 'foreignerInfo.gender', raw, genderVal, conf);
        }
        break;
      }
      case 'address': {
        const addrRaw = raw.trim();
        formData.japanAddress = addrRaw;
        pushField(fields, 'foreignerInfo.japanAddress', raw, addrRaw, conf);
        
        const parsed = splitJapanAddress(addrRaw);
        if (parsed.zipCode && !formData.japanZipCode) {
          formData.japanZipCode = parsed.zipCode;
          pushField(fields, 'foreignerInfo.japanZipCode', raw, parsed.zipCode, conf);
        }
        if (parsed.prefecture && !formData.japanPrefecture) {
          formData.japanPrefecture = parsed.prefecture;
          pushField(fields, 'foreignerInfo.japanPrefecture', raw, parsed.prefecture, conf);
        }
        if (parsed.city && !formData.japanCity) {
          formData.japanCity = parsed.city;
          pushField(fields, 'foreignerInfo.japanCity', raw, parsed.city, conf);
        }
        if (parsed.addressLines && !formData.japanAddressLines) {
          formData.japanAddressLines = parsed.addressLines;
          pushField(fields, 'foreignerInfo.japanAddressLines', raw, parsed.addressLines, conf);
        }
        break;
      }
      case 'residence-status':
      case 'visa_type':
      case 'status_of_residence': {
        formData.currentResidenceStatus = raw.trim();
        pushField(fields, 'foreignerInfo.currentResidenceStatus', raw, raw.trim(), conf);
        break;
      }
    }
  }
}

// ─── 正規表現ベース抽出（汎用OCR テキスト全文から） ──────────────────────────

/**
 * Document AI が返す全文テキストから foreignerInfo フィールドを正規表現で補完する。
 * Entity から抽出できなかったフィールドのフォールバックとして機能する。
 */
export function extractForeignerFromRawText(
  text: string,
  formData: ForeignerFormData,
  fields: OcrExtractedField[]
): void {
  // 在留カード番号: 英2桁 + 数字8桁 + 英2桁
  if (!formData.residenceCardNumber) {
    const cardMatch = text.match(/\b([A-Z]{2}\d{8}[A-Z]{2})\b/);
    if (cardMatch) {
      formData.residenceCardNumber = cardMatch[1];
      pushField(fields, 'foreignerInfo.residenceCardNumber', cardMatch[1], cardMatch[1], 0.7);
      
      if (formData.hasResidenceCard === undefined || formData.hasResidenceCard === null) {
        formData.hasResidenceCard = true;
        pushField(fields, 'foreignerInfo.hasResidenceCard', cardMatch[1], 'true', 0.7);
      }
    }
  }

  // パスポート番号: 英字1〜2桁 + 数字7〜8桁
  if (!formData.passportNumber) {
    const ppMatch = text.match(/\b([A-Z]{1,2}\d{7,8})\b/);
    if (ppMatch) {
      formData.passportNumber = ppMatch[1];
      pushField(fields, 'foreignerInfo.passportNumber', ppMatch[1], ppMatch[1], 0.6);
    }
  }

  // 性別 (gender)
  if (!formData.gender) {
    // "性別 SEX" や "性別：" などの後にある「男」「女」「M」「F」をキャプチャする
    const sexMatch = text.match(/(?:性別|SEX)[\s：:]*([男女MF])/i);
    if (sexMatch) {
      const valLower = sexMatch[1].toUpperCase();
      let genderVal: 'male' | 'female' | undefined;
      if (valLower === '男' || valLower === 'M') genderVal = 'male';
      else if (valLower === '女' || valLower === 'F') genderVal = 'female';
      
      if (genderVal) {
        formData.gender = genderVal;
        pushField(fields, 'foreignerInfo.gender', sexMatch[0].trim(), genderVal, 0.65);
      }
    }
  }

  // 氏名（ローマ字・漢字の推定）
  if (!formData.nameEn) {
    // 氏名 XIE YIBING のように同一行にある英語をキャプチャする（A-Zとスペースに限定し、次の行の NAME などを誤爆防止）
    const nameMatch = text.match(/氏名[\s：:]*([A-Z ]+)/);
    if (nameMatch) {
      const parsedName = nameMatch[1].trim();
      if (parsedName) {
        formData.nameEn = parsedName;
        pushField(fields, 'foreignerInfo.nameEn', nameMatch[0].trim(), formData.nameEn, 0.6);
      }
    }
  }

  // 在留資格
  if (!formData.currentResidenceStatus) {
    const statusPatterns = [
      /在留資格[\s：:]*([^\n]+)/,
      /(特定技能[12号]*|技術[・\/]人文知識[・\/]国際業務|経営[・\/]管理|技能実習[123号]*|留学|家族滞在|永住者|定住者|日本人の配偶者等|高度専門職[12号]*)/,
    ];
    for (const pattern of statusPatterns) {
      const m = text.match(pattern);
      if (m && m[1]) {
        formData.currentResidenceStatus = m[1].trim();
        pushField(fields, 'foreignerInfo.currentResidenceStatus', m[1], m[1].trim(), 0.65);
        break;
      }
    }
  }

  // 在留期間 (currentStayPeriod)
  if (!formData.currentStayPeriod) {
    // "在留期間" または "PERIOD OF STAY" の直後に出現する「○年」や「○ヶ月」をキャプチャする
    const periodMatch = text.match(/(?:在留期間|PERIOD OF STAY)[\s\S]{0,50}?([\d]+(?:年|ヶ月|カ月|月))/);
    if (periodMatch && periodMatch[1]) {
      formData.currentStayPeriod = periodMatch[1];
      pushField(fields, 'foreignerInfo.currentStayPeriod', periodMatch[1], periodMatch[1], 0.7);
    }
  }

  // 在留期間の満了日
  if (!formData.stayExpiryDate) {
    const expiryPatterns = [
      /このカードは\s*([\d\s]{4}年[\d\s]{1,2}月[\d\s]{1,2}日)\s*まで有効/,
      /在留期間.*?満了日.*?(?:[\n\sA-Za-z\(\)]*)([\d\s]{4}年[\d\s]{1,2}月[\d\s]{1,2}日)/,
      /(?:在留期限|満了日|有効期限|在留期間)[\s：:]*([\d年月日\s\/\.\-]+)/,
    ];
    for (const pattern of expiryPatterns) {
      const m = text.match(pattern);
      if (m && m[1]) {
        const normalized = normalizeDate(m[1].trim());
        if (normalized) {
          formData.stayExpiryDate = normalized;
          pushField(fields, 'foreignerInfo.stayExpiryDate', m[1], normalized, 0.7);
          break;
        }
      }
    }
  }

  // 国籍
  if (!formData.nationality) {
    // 国籍・地域 中国 のように、行の終端までをキャプチャする（改行を越えない）
    const natMatch = text.match(/国籍[・\/地域]*[\s：:]*([^\n]+)/);
    if (natMatch && natMatch[1]) {
      formData.nationality = natMatch[1].trim();
      pushField(fields, 'foreignerInfo.nationality', natMatch[1], natMatch[1].trim(), 0.7);
    }
  }



  // 生年月日
  if (!formData.birthDate) {
    const birthPatterns = [
      /生年月日[\s：:]*([\d年月日\s\/\.\-]+)/,
      /Date\s+of\s+Birth[\s：:]*([\d\/\.\-]+)/i,
    ];
    for (const pattern of birthPatterns) {
      const m = text.match(pattern);
      if (m) {
        const normalized = normalizeDate(m[1].trim());
        if (normalized) {
          formData.birthDate = normalized;
          pushField(fields, 'foreignerInfo.birthDate', m[1], normalized, 0.7);
          break;
        }
      }
    }
  }

  // 住居地 (住所)
  if (!formData.japanAddress) {
    const addressMatch = text.match(/住居地[\s：:]*([^\n]+)/);
    if (addressMatch) {
      const addrRaw = addressMatch[1].trim();
      formData.japanAddress = addrRaw;
      pushField(fields, 'foreignerInfo.japanAddress', addressMatch[0].trim(), addrRaw, 0.7);
      
      const parsed = splitJapanAddress(addrRaw);
      if (parsed.zipCode && !formData.japanZipCode) {
        formData.japanZipCode = parsed.zipCode;
        pushField(fields, 'foreignerInfo.japanZipCode', addrRaw, parsed.zipCode, 0.7);
      }
      if (parsed.prefecture && !formData.japanPrefecture) {
        formData.japanPrefecture = parsed.prefecture;
        pushField(fields, 'foreignerInfo.japanPrefecture', addrRaw, parsed.prefecture, 0.7);
      }
      if (parsed.city && !formData.japanCity) {
        formData.japanCity = parsed.city;
        pushField(fields, 'foreignerInfo.japanCity', addrRaw, parsed.city, 0.7);
      }
      if (parsed.addressLines && !formData.japanAddressLines) {
        formData.japanAddressLines = parsed.addressLines;
        pushField(fields, 'foreignerInfo.japanAddressLines', addrRaw, parsed.addressLines, 0.7);
      }
    }
  }

  // ED番号 (英字4桁 + 数字7桁)
  if (!formData.edNumberAlpha || !formData.edNumberNumeric) {
    // 間にスペースやハイフンがあるケースも考慮
    const edMatch = text.match(/(?:^|[^A-Za-z0-9])([A-Za-z]{4})\s*[-ー]?\s*(\d{7})(?:[^A-Za-z0-9]|$)/);
    if (edMatch) {
      const alpha = edMatch[1].toUpperCase();
      const num = edMatch[2];
      formData.edNumberAlpha = alpha;
      formData.edNumberNumeric = num;
      pushField(fields, 'foreignerInfo.edNumberAlpha', edMatch[0].trim(), alpha, 0.7);
      pushField(fields, 'foreignerInfo.edNumberNumeric', edMatch[0].trim(), num, 0.7);
    }
  }

  // 性別
  if (!formData.gender) {
    const genderMatch = text.match(/性別[：:]?\s*(男|女|M|F|Male|Female)(?:\n|$)/i);
    if (genderMatch) {
      const valLower = genderMatch[1].toLowerCase();
      let genderVal: 'male' | 'female' | undefined;
      if (valLower.includes('男') || valLower.includes('m')) genderVal = 'male';
      else if (valLower.includes('女') || valLower.includes('f')) genderVal = 'female';

      if (genderVal) {
        formData.gender = genderVal;
        pushField(fields, 'foreignerInfo.gender', genderMatch[1], genderVal, 0.6);
      }
    }
  }

  // 在留カードの有無（在留カード番号が抽出できていればtrueとする推論）
  if (formData.hasResidenceCard === undefined && formData.residenceCardNumber) {
    formData.hasResidenceCard = true;
    // 生の抽出文字列ではなく推論結果なので、rawValue は '推論' としておく
    pushField(fields, 'foreignerInfo.hasResidenceCard', '推論', 'true', 1.0);
  }
}
