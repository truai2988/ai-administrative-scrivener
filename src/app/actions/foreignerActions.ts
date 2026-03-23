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

    const dataWithConsent = {
      ...formData,
      consentLog: {
        ipAddress,
        userAgent,
        agreedAt,
      },
    };

    await foreignerService.submitForeignerEntry(id, dataWithConsent);
    return { success: true };
  } catch (error) {
    console.error("Error submitting foreigner entry:", error);
    return { success: false, error: "送信に失敗しました。" };
  }
}
