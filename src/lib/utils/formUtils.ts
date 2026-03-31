/**
 * formUtils.ts
 * フォーム関連の汎用ユーティリティ関数
 *
 * 今後、別の在留資格フォームなどにも再利用できる設計にする。
 */

/**
 * initialValues と defaultValues をセクションごとに深くマージする。
 *
 * React Hook Form の useForm({ defaultValues }) は非同期ロードされた値を
 * マウント後に反映できないため、reset() と組み合わせて使う。
 * このユーティリティは「深い」マージを保証し、欠損フィールドを防ぐ。
 *
 * @param initialValues - 外部から渡されるデータ（Firestore取得値 / フォールバック値）
 * @param defaults - フォームのデフォルト値（型の全フィールドが揃っている）
 * @returns マージされた完全な形のデータ
 */
export function mergeWithDefaults<T extends Record<string, unknown>>(
  initialValues: Partial<T> | undefined | null,
  defaults: T
): T {
  if (!initialValues) return defaults;

  const merged = { ...defaults, ...initialValues } as T;

  // オブジェクト型のトップレベルフィールドをセクションごとにマージする
  for (const key of Object.keys(defaults) as (keyof T)[]) {
    const defaultVal = defaults[key];
    const initialVal = initialValues[key as keyof typeof initialValues];

    if (
      defaultVal !== null &&
      typeof defaultVal === 'object' &&
      !Array.isArray(defaultVal) &&
      initialVal !== null &&
      typeof initialVal === 'object' &&
      !Array.isArray(initialVal)
    ) {
      merged[key] = {
        ...(defaultVal as Record<string, unknown>),
        ...(initialVal  as Record<string, unknown>),
      } as T[keyof T];
    }
  }

  return merged;
}
