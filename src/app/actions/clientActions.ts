"use server";

import { foreignerService } from "@/services/foreignerService";
import { Foreigner } from "@/types/database";
import { revalidatePath } from "next/cache";

export async function submitClientEditAction(id: string, formData: Partial<Foreigner>) {
  try {
    // 支援機関による追記とステータス更新
    await foreignerService.updateBySupportAgency(id, formData);
    
    // ダッシュボードのキャッシュを無効化して最新データを表示させる
    revalidatePath("/");
    
    return { success: true };
  } catch (error) {
    console.error("Error submitting client edit:", error);
    return { success: false, error: "保存に失敗しました。" };
  }
}
