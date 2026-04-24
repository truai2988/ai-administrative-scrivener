/**
 * COE用カスケードマップ生成スクリプト
 *
 * dropdowns.json にカスケードマッピング (_CASCADING_MAPS) を注入する。
 * dropdowns_change.json のカスケードマップから、COE でも共通して使える
 * _CA94, _CC02_3, _CC04 のマッピングを流用する。
 *
 * 使い方: node scripts/generate_coe_cascade_maps.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const coeDropdownsPath = path.join(__dirname, 'data-extraction', 'dropdowns.json');
const changeDropdownsPath = path.join(__dirname, '..', 'src', 'lib', 'constants', 'dropdowns_change.json');

// 1. 読み込み
const coeDropdowns = JSON.parse(fs.readFileSync(coeDropdownsPath, 'utf8'));
const changeDropdowns = JSON.parse(fs.readFileSync(changeDropdownsPath, 'utf8'));

const changeMaps = changeDropdowns._CASCADING_MAPS || {};

// 2. COE 側にも存在する親リストのキーだけを検証してコピー
const cascadePrefixes = ['_CA94', '_CC02_3', '_CC04'];
const coeCascadingMaps = {};

for (const prefix of cascadePrefixes) {
  const parentKey = `${prefix}_L`;
  if (!coeDropdowns[parentKey]) {
    console.warn(`[SKIP] 親リスト ${parentKey} が dropdowns.json に存在しません`);
    continue;
  }
  if (!changeMaps[prefix]) {
    console.warn(`[SKIP] カスケードマップ ${prefix} が dropdowns_change.json に存在しません`);
    continue;
  }

  const parentLabels = coeDropdowns[parentKey];
  const sourceMap = changeMaps[prefix];

  // 検証: COE側の親ラベルがマップに含まれているか
  const mapping = {};
  let matched = 0;
  let missing = 0;
  for (const label of parentLabels) {
    if (sourceMap[label] !== undefined) {
      // 対応する子キーが COE dropdowns.json に存在するか確認
      const childKey = `${prefix}_${sourceMap[label]}_L`;
      if (coeDropdowns[childKey]) {
        mapping[label] = sourceMap[label];
        matched++;
      } else {
        console.warn(`  [WARN] 子キー ${childKey} が dropdowns.json に存在しません (親: ${label.substring(0, 40)})`);
        missing++;
      }
    } else {
      console.warn(`  [WARN] ラベル "${label.substring(0, 40)}" のマッピングが change マスターに存在しません`);
      missing++;
    }
  }

  if (matched > 0) {
    coeCascadingMaps[prefix] = mapping;
    console.log(`[OK] ${prefix}: ${matched} 件マッピング成功, ${missing} 件未マッチ`);
  } else {
    console.warn(`[SKIP] ${prefix}: マッピング成功件数が 0 件`);
  }
}

// 3. dropdowns.json に _CASCADING_MAPS を注入して保存
coeDropdowns._CASCADING_MAPS = coeCascadingMaps;
fs.writeFileSync(coeDropdownsPath, JSON.stringify(coeDropdowns, null, 2), 'utf8');

console.log('\n=== 完了 ===');
console.log(`カスケードマップ ${Object.keys(coeCascadingMaps).length} 件を dropdowns.json に注入しました`);
console.log('注入されたプレフィックス:', Object.keys(coeCascadingMaps));
for (const [prefix, map] of Object.entries(coeCascadingMaps)) {
  console.log(`  ${prefix}: ${Object.keys(map).length} 件のマッピング`);
}
