"use server";

import { foreignerService } from "@/services/foreignerService";
import { Foreigner } from "@/types/database";
import { headers } from "next/headers";

// ─── 職員による外国人の新規登録 ──────────────────────────────────────────────
/**
 * 職員がPCで書類をスキャンし、外国人プロフィールを新規登録するアクション。
 * （QRコードを使わない職員代理登録フロー専用）
 */
export async function registerForeignerByStaffAction(
  data: Partial<Foreigner>
): Promise<{ success: boolean; foreignerId?: string; error?: string }> {
  try {
    const now = new Date().toISOString();
    const newId = `staff-${Date.now()}`;

    const payload: Partial<Foreigner> = {
      name: data.name || '',
      nationality: data.nationality || '',
      birthDate: data.birthDate || '',
      residenceCardNumber: data.residenceCardNumber || '',
      expiryDate: data.expiryDate || '',
      unionId: data.unionId || 'scrivener_direct',
      enterpriseId: data.enterpriseId || undefined,
      status: '準備中',
      isEditedByAdmin: true,
      ...(data.email                 && { email: data.email }),
      ...(data.visaType              && { visaType: data.visaType }),
      ...(data.photoUrl              && { photoUrl: data.photoUrl }),
      ...(data.residenceCardFrontUrl && { residenceCardFrontUrl: data.residenceCardFrontUrl }),
      ...(data.residenceCardBackUrl  && { residenceCardBackUrl: data.residenceCardBackUrl }),
      ...(data.passportImageUrl      && { passportImageUrl: data.passportImageUrl }),
      createdAt: now,
      updatedAt: now,
    };

    // foreignerService.submitForeignerEntry は ID 指定で新規作成にも対応している
    await foreignerService.submitForeignerEntry(newId, payload);

    return { success: true, foreignerId: newId };
  } catch (error) {
    console.error("Error registering foreigner by staff:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: `登録に失敗しました: ${errorMessage}` };
  }
}

// ─── 外国人本人フォームからの新規申請 ────────────────────────────────────────
export async function submitForeignerEntryAction(id: string, formData: Partial<Foreigner>) {
  try {
    const headersList = await headers();
    const forwardedFor = headersList.get("x-forwarded-for");
    const ipAddress = forwardedFor ? forwardedFor.split(",")[0] : "unknown";
    const userAgent = headersList.get("user-agent") || "unknown";
    const agreedAt = new Date().toISOString();

    const dataWithConsent: Partial<Foreigner> = {
      ...formData,
      consentLog: {
        ipAddress,
        userAgent,
        agreedAt,
      },
      originalSubmittedData: { ...formData }, // 確実にスナップショットとして別の参照で保存
    };

    await foreignerService.submitForeignerEntry(id, dataWithConsent);
    return { success: true };
  } catch (error) {
    console.error("Error submitting foreigner entry:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: `送信に失敗しました: ${errorMessage}` };
  }
}

/**
 * 行政書士: エラーデータの修正（修正モード）
 */
export async function correctDataAction(
  id: string,
  updatedData: Partial<Foreigner>,
  reason: string,
  correctedBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!reason?.trim()) {
      return { success: false, error: "修正理由が入力されていません。" };
    }
    
    await foreignerService.correctForeignerData(id, updatedData, reason, correctedBy);
    return { success: true };
  } catch (error) {
    console.error("Error correcting data:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: `データの修正に失敗しました: ${errorMessage}` };
  }
}

/**
 * 支部事務員: 行政書士へ確認依頼 (approvalStatus: pending_review へ)
 */
export async function requestReviewAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await foreignerService.updateApprovalStatus(id, 'pending_review');
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: `確認依頼に失敗しました: ${errorMessage}` };
  }
}

/**
 * 行政書士: 承認 (approvalStatus: approved へ)
 */
export async function approveAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await foreignerService.updateApprovalStatus(id, 'approved');
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: `承認処理に失敗しました: ${errorMessage}` };
  }
}

/**
 * 行政書士: 差し戻し (approvalStatus: returned へ)
 */
export async function returnAction(id: string, reason: string): Promise<{ success: boolean; error?: string }> {
  try {
    await foreignerService.updateApprovalStatus(id, 'returned', reason);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: `差し戻し処理に失敗しました: ${errorMessage}` };
  }
}
