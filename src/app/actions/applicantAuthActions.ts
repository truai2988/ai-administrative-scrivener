"use server";

import { getAdminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { Foreigner, User, DEFAULT_UNION_ID } from "@/types/database";
import { headers } from "next/headers";

/**
 * 申請人が自身でアカウントを作成し、外国人データと紐付けるサーバーアクション
 * @param uid Firebase Authでクライアント側で作成されたUID
 * @param email 申請人のメールアドレス
 * @param token URLパラメータ等から渡される組織トークン（unionId等）
 * @param foreignerData フォームから送信された初期情報（パスポート画像URL、顔写真URL等）
 */
export async function registerApplicantAccountAction(
  uid: string,
  email: string,
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

    // 1. 組織の検証 (token が存在しない、または無効な場合はエラー)
    if (!token) {
      throw new Error("招待リンクが無効です。所属組織が指定されていません。");
    }

    let resolvedUnionId = token;
    let resolvedEnterpriseId: string | undefined = undefined;

    // scrivener_direct (直接受任) 以外の場合は、組織マスタに存在するか一応確認する
    if (token !== DEFAULT_UNION_ID) {
      const orgDoc = await db.collection("organizations").doc(token).get();
      if (!orgDoc.exists) {
        throw new Error("指定された組織が見つかりません。無効な招待リンクです。");
      }
      const orgData = orgDoc.data();
      if (orgData?.type === 'enterprise') {
        resolvedEnterpriseId = token;
        // ※必要に応じて、この企業が属するunionIdを引っ張る処理を追加することも可能
        // 現在はエンタープライズIDのみ設定
        resolvedUnionId = DEFAULT_UNION_ID; // 一時的なフォールバック
      }
    }

    // 2. ユーザー(users) ドキュメントが既に存在するか確認
    const userRef = db.collection("users").doc(uid);
    const userDoc = await userRef.get();
    if (userDoc.exists) {
      throw new Error("このアカウントは既に登録されています。");
    }

    const userData: User = {
      id: uid,
      email: email,
      displayName: foreignerData.name || "未設定",
      role: "applicant",
      // applicantの場合は、管理画面へのアクセス権限がないため organizationId は null とするか、
      // 閲覧権限用に所属組織IDを持たせるか。ここでは閲覧用として保持。
      organizationId: token === DEFAULT_UNION_ID ? null : token,
      createdAt: now,
      updatedAt: now,
    };

    // 3. 外国人データ(foreigners)の作成
    const foreignerRef = db.collection("foreigners").doc();
    const newForeignerId = foreignerRef.id;

    const newForeigner: Partial<Foreigner> = {
      ...foreignerData,
      id: newForeignerId,
      userId: uid,
      unionId: resolvedUnionId,
      enterpriseId: resolvedEnterpriseId,
      status: "準備中", // 初期ステータス
      isEditedByAdmin: false,
      consentLog: {
        ipAddress,
        userAgent,
        agreedAt: now,
      },
      createdAt: now,
      updatedAt: now,
    };

    // 4. Firestore バッチ処理（users, foreigners, stats更新 を同時に実行）
    const batch = db.batch();
    
    batch.set(userRef, userData);
    batch.set(foreignerRef, newForeigner);

    // 統計情報の更新 (ステータスが "準備中" = pending の増加)
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
    console.error("Error registering applicant account:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: `登録処理に失敗しました: ${errorMessage}` };
  }
}
