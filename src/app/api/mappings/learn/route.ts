/**
 * POST /api/mappings/learn
 *
 * Click-to-Fill で手動マッピングされた「breadcrumb → fieldPath」ペアを
 * 受け取り、Firestore に永続化するエンドポイント。
 *
 * ■ 保存先: users/{userId}/mappingPreferences/default
 * ■ merge: true でキー単位の上書き（最新の操作が常に正解）
 *
 * 注: 現在のメインフローはクライアント側で直接 Firestore に書き込むため、
 * このエンドポイントはバックアップ / 将来の信頼度スコア計算用に残されている。
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

// ─── リクエストボディ型 ───────────────────────────────────────────────────────

interface LearnMappingRequest {
  /** 抽出データの breadcrumb（例: ["身分事項", "氏名（英字）"]） */
  breadcrumb: string[];
  /** マッピング先フィールドパス（例: "foreignerInfo.nameEn"） */
  fieldPath: string;
  /** 抽出された元の値 */
  extractedValue: string;
  /** 代入された正規化後の値 */
  filledValue: string;
  /** ユーザーID（オプション：将来のサーバーサイド認証で置き換え） */
  userId?: string;
}

// ─── ハンドラ ─────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body: LearnMappingRequest = await req.json();

    // バリデーション
    if (!body.breadcrumb || !Array.isArray(body.breadcrumb) || body.breadcrumb.length === 0) {
      return NextResponse.json(
        { error: 'breadcrumb は必須です（空でない配列）' },
        { status: 400 },
      );
    }

    if (!body.fieldPath || typeof body.fieldPath !== 'string') {
      return NextResponse.json(
        { error: 'fieldPath は必須です（文字列）' },
        { status: 400 },
      );
    }

    const breadcrumbKey = body.breadcrumb.join(' > ');

    // ── ログ出力（デバッグ用） ─────────────────────────────────────────
    console.log(
      `[MappingLearn] 📝 学習データ受信:\n` +
      `  breadcrumb: ${breadcrumbKey}\n` +
      `  fieldPath:  ${body.fieldPath}\n` +
      `  value:      "${body.extractedValue}" → "${body.filledValue}"`,
    );

    // ── Firestore への永続化（サーバーサイド） ─────────────────────────
    // 注: クライアント側（useMappingPreferences）でも保存しているため、
    // このエンドポイントは統計・信頼度スコア集計のバックアップとして機能。
    if (body.userId) {
      const db = getAdminDb();
      const docRef = db
        .collection('users')
        .doc(body.userId)
        .collection('mappingPreferences')
        .doc('default');

      await docRef.set(
        {
          mappings: { [breadcrumbKey]: body.fieldPath },
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[MappingLearn] Error:', message);
    return NextResponse.json(
      { error: `学習データの保存に失敗しました: ${message}` },
      { status: 500 },
    );
  }
}
