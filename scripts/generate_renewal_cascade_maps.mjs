/**
 * Renewal 用カスケードマップ生成スクリプト
 *
 * dropdowns_renewal.json 内のキー命名規則を解析し、
 * _CASCADING_MAPS（親ラベル→子サフィックスのマッピング）を自動生成・注入する。
 *
 * アーキテクチャは generate_coe_cascade_maps.mjs と同一。
 *
 * 使い方: node scripts/generate_renewal_cascade_maps.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const renewalDropdownsPath = path.join(
  __dirname, '..', 'src', 'lib', 'constants', 'dropdowns_renewal.json'
);

// 1. 読み込み
const renewalDropdowns = JSON.parse(fs.readFileSync(renewalDropdownsPath, 'utf8'));
const keys = Object.keys(renewalDropdowns);

// 2. カスケード対象の親プレフィックスを定義
//    在留期間更新の特定技能様式で実際に使うもののみ
const cascadePrefixes = [
  '_CC04',     // 特定技能分野 → 業務区分
  '_CA94',     // 技能実習の職種 → 作業
  '_CC02_3',   // 技能実習の職種(別テーブル) → 作業
  '_CB19',     // 現に有する在留資格 → 在留期間
  '_CB19_0',   // 希望する在留資格 → 在留期間
  '_CC02_1',   // 主たる職種（特定技能1号）→ 詳細
  '_CC02_5',   // 主たる職種（特定技能5）→ 詳細
  '_CC13_1',   // 業種分類1 → 事業内容
  '_CC13_2',   // 業種分類2 → 事業内容
  '_CC52_1',   // 在留資格サブカテゴリ → 詳細区分
];

const cascadingMaps = {};

for (const prefix of cascadePrefixes) {
  const parentKey = `${prefix}_L`;
  if (!renewalDropdowns[parentKey]) {
    console.warn(`[SKIP] 親リスト ${parentKey} が dropdowns_renewal.json に存在しません`);
    continue;
  }

  const parentLabels = renewalDropdowns[parentKey];

  // 子キーの候補を列挙: _PREFIX_SUFFIX_L (ただし _PREFIX_L 自身は除外)
  const childKeys = keys.filter(
    k => k.startsWith(`${prefix}_`) && k.endsWith('_L') && k !== parentKey
  );

  if (childKeys.length === 0) {
    console.warn(`[SKIP] ${prefix}: 子キーが見つかりません`);
    continue;
  }

  // 子キーからサフィックスを抽出: _PREFIX_SUFFIX_L → SUFFIX
  const childSuffixes = childKeys.map(k => {
    const withoutPrefix = k.substring(prefix.length + 1); // +1 for '_'
    return withoutPrefix.replace(/_L$/, '');
  });

  // 親のラベル（_C 版）と子サフィックスの対応を構築
  // _C 版は [label, code, label, code, ...] の交互配列
  const parentCKey = `${prefix}_C`;
  const parentCArr = renewalDropdowns[parentCKey];

  const mapping = {};
  let matched = 0;
  let missing = 0;

  if (parentCArr && parentCArr.length >= 2) {
    // _C 版のコード→サフィックス対応テーブルを構築
    const codeToSuffix = {};
    for (const suffix of childSuffixes) {
      // サフィックスがそのまま子キーのコード部分
      codeToSuffix[suffix] = suffix;
    }

    // 親ラベルとコードのペアを走査
    for (let i = 0; i < parentCArr.length; i += 2) {
      const label = parentCArr[i];
      const code = parentCArr[i + 1];

      // コードからサフィックスを探す (直接一致, T付き, 0埋めなど)
      let foundSuffix = null;

      // 直接一致
      if (childSuffixes.includes(code)) {
        foundSuffix = code;
      }
      // T + コード (在留資格の T02, T03 パターン)
      else if (childSuffixes.includes(`T${code}`)) {
        foundSuffix = `T${code}`;
      }
      // 0埋め2桁
      else if (code.length === 1 && childSuffixes.includes(`0${code}`)) {
        foundSuffix = `0${code}`;
      }
      // 0埋め3桁
      else if (code.length <= 3) {
        const padded = code.padStart(3, '0');
        if (childSuffixes.includes(padded)) {
          foundSuffix = padded;
        }
      }
      // 04XX パターン (CC02_1 等)
      if (!foundSuffix) {
        const candidate04 = `04${code}`;
        if (childSuffixes.includes(candidate04)) {
          foundSuffix = candidate04;
        }
      }
      // 05TX パターン (CC52_1 等)
      if (!foundSuffix) {
        const candidate05 = `05T${code}`;
        if (childSuffixes.includes(candidate05)) {
          foundSuffix = candidate05;
        }
      }

      if (foundSuffix) {
        // 対応する子キーが実際に存在するか最終確認
        const childKey = `${prefix}_${foundSuffix}_L`;
        if (renewalDropdowns[childKey]) {
          // ラベルは _L 版のラベルを使用（UIに表示する値と一致させるため）
          const labelIdx = parentLabels.indexOf(label);
          if (labelIdx !== -1) {
            mapping[label] = foundSuffix;
            matched++;
          } else {
            // _L版に同じラベルがない → _L版のラベルと照合
            // _C版と_L版で同じ順番と仮定してマッチ
            const lIdx = Math.floor(i / 2);
            if (lIdx < parentLabels.length) {
              mapping[parentLabels[lIdx]] = foundSuffix;
              matched++;
            } else {
              console.warn(`  [WARN] ラベル "${label.substring(0, 50)}" が _L 版に見つかりません`);
              missing++;
            }
          }
        } else {
          console.warn(`  [WARN] 子キー ${childKey} が存在しません (親: ${label.substring(0, 40)})`);
          missing++;
        }
      } else {
        console.warn(`  [WARN] コード "${code}" → サフィックスが見つかりません (親: ${label.substring(0, 40)})`);
        missing++;
      }
    }
  } else {
    // _C 版がない場合、_L版の順序と子キーのソート順で対応付け試行
    console.warn(`  [INFO] ${parentCKey} が存在しないため、_L版のラベル順と子キーの順序で対応付けを試みます`);
    // この場合は安全に生成できないのでスキップ
    missing = parentLabels.length;
  }

  if (matched > 0) {
    cascadingMaps[prefix] = mapping;
    console.log(`[OK] ${prefix}: ${matched} 件マッピング成功, ${missing} 件未マッチ`);
  } else {
    console.warn(`[SKIP] ${prefix}: マッピング成功件数が 0 件`);
  }
}

// 3. dropdowns_renewal.json に _CASCADING_MAPS を注入して保存
renewalDropdowns._CASCADING_MAPS = cascadingMaps;
fs.writeFileSync(renewalDropdownsPath, JSON.stringify(renewalDropdowns, null, 2), 'utf8');

console.log('\n=== 完了 ===');
console.log(`カスケードマップ ${Object.keys(cascadingMaps).length} 件を dropdowns_renewal.json に注入しました`);
console.log('注入されたプレフィックス:', Object.keys(cascadingMaps));
for (const [prefix, map] of Object.entries(cascadingMaps)) {
  console.log(`  ${prefix}: ${Object.keys(map).length} 件のマッピング`);
}

// 4. 未マッチ項目の詳細サマリー
console.log('\n=== 未マッチ/スキップ項目の詳細 ===');
const skippedPrefixes = cascadePrefixes.filter(p => !cascadingMaps[p]);
if (skippedPrefixes.length > 0) {
  console.log('完全スキップされたプレフィックス:', skippedPrefixes);
}
