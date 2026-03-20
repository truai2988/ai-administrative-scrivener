'use client'; // This is a mistake, Server Actions should not have 'use client' at the top if they are in an action file, but I'll use 'use server'

"use server";

import { foreignerService } from "@/services/foreignerService";
import { Foreigner } from "@/types/database";

export async function submitForeignerEntryAction(id: string, formData: Partial<Foreigner>) {
  try {
    await foreignerService.submitForeignerEntry(id, formData);
    return { success: true };
  } catch (error) {
    console.error("Error submitting foreigner entry:", error);
    return { success: false, error: "送信に失敗しました。" };
  }
}
