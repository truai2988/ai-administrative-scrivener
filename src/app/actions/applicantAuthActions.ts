"use server";

import { getAdminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { Foreigner } from "@/types/database";
import { headers } from "next/headers";

/**
 * 申請人が情報を送信し、外国人データとして台帳に登録するサーバーアクション（アカウント作成なし）
 * @param token URLパラメータ等から渡される組織トークン（unionId等）
 * @param foreignerData フォームから送信された初期情報（パスポート画像URL、顔写真URL等）
 */
export async function submitApplicantRegistrationAction(
  token: string | undefined,
  foreignerData: Partial<Foreigner>
): Promise<{ success: boolean; error?: string; foreignerId?: string }> {
  try {
    const db = getAdminDb();
    const now = new Date().toISOString();
    
    // IPアドレスとUserAgent（同意ログ用）
    const headersList = await headers();
    const forwardedFor = headersList.get("x-forwarded-for");
    const ipAddress = forwardedFor ? forwardedFor.split(",")[0] : "unknown";
    const userAgent = headersList.get("user-agent") || "unknown";

    // 1. 組織の検証
    console.log("[submitApplicantRegistrationAction] Received token:", token);
    
    // 文字列の "null" や "undefined" が渡された場合のフォールバック
    if (token === "null" || token === "undefined" || token === "unassigned") {
      token = undefined;
    }

    let resolvedUnionId: string | undefined;
    let resolvedEnterpriseId: string | undefined;

    if (token && !token.startsWith("test-")) {
      const orgDoc = await db.collection("organizations").doc(token).get();
      if (!orgDoc.exists) {
        throw new Error("指定された組織が見つかりません。無効な招待リンクです。");
      }
      const orgData = orgDoc.data();
      if (orgData?.type === 'enterprise') {
        resolvedEnterpriseId = token;
        resolvedUnionId = undefined; 
      } else {
        resolvedUnionId = token;
      }
    } else if (token && token.startsWith("test-")) {
      // テストトークンの場合は検証をスキップして未所属に割り当てる
      resolvedUnionId = undefined;
    }

    // 2. 外国人データ(foreigners)の作成
    const foreignerRef = db.collection("foreigners").doc();
    const newForeignerId = foreignerRef.id;

    // TypeScriptとFirestoreのエラーを回避するため、未定義の可能性のある値を取り除くか、条件付きで追加する
    const newForeigner: Partial<Foreigner> = {
      ...foreignerData,
      id: newForeignerId,
      unionId: resolvedUnionId,
      status: "作成中", // 初期ステータス
      isEditedByAdmin: false,
      consentLog: {
        ipAddress,
        userAgent,
        agreedAt: now,
      },
      createdAt: now,
      updatedAt: now,
    };

    if (resolvedEnterpriseId) {
      newForeigner.enterpriseId = resolvedEnterpriseId;
    }

    // 3. Firestore バッチ処理（foreigners, stats更新 を同時に実行）
    const batch = db.batch();
    
    batch.set(foreignerRef, newForeigner);

    // 統計情報の更新 (ステータスが "作成中" = pending の増加)
    const diff = { total: 1, pending: 1, completed: 0 };
    
    // グローバル統計
    batch.set(db.collection("foreigner_stats").doc("global"), {
      total: FieldValue.increment(diff.total),
      pending: FieldValue.increment(diff.pending),
      completed: FieldValue.increment(diff.completed)
    }, { merge: true });

    // 組合別統計
    if (resolvedUnionId) {
      batch.set(db.collection("foreigner_stats").doc(`union_${resolvedUnionId}`), {
        total: FieldValue.increment(diff.total),
        pending: FieldValue.increment(diff.pending),
        completed: FieldValue.increment(diff.completed)
      }, { merge: true });
    }

    // 企業別統計
    if (resolvedEnterpriseId) {
      batch.set(db.collection("foreigner_stats").doc(`enterprise_${resolvedEnterpriseId}`), {
        total: FieldValue.increment(diff.total),
        pending: FieldValue.increment(diff.pending),
        completed: FieldValue.increment(diff.completed)
      }, { merge: true });
    }

    await batch.commit();

    return { success: true, foreignerId: newForeignerId };
  } catch (error) {
    console.error("Error submitting applicant registration:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: `登録処理に失敗しました: ${errorMessage}` };
  }
}
