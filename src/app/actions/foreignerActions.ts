"use server";

import { foreignerService } from "@/services/foreignerService";
import { Foreigner } from "@/types/database";
import { headers } from "next/headers";

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
