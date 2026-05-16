const fs = require('fs');
const path = require('path');

/**
 * dropdowns_*.json から使用されていないキーを削除し、ファイルサイズを最適化するスクリプト。
 * 
 * 使い方:
 * node scripts/optimize_dropdowns.js
 */

function optimizeJson(file, optionsFile, cascadePrefixes) {
  const jsonPath = path.join(__dirname, '../src/lib/constants', file);
  const optionsPath = path.join(__dirname, '../src/lib/constants', optionsFile);
  if (!fs.existsSync(jsonPath) || !fs.existsSync(optionsPath)) {
    console.log(`[SKIP] ${file} または ${optionsFile} が見つかりません。`);
    return;
  }

  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const txt = fs.readFileSync(optionsPath, 'utf8');

  // ソースコードから明示的に参照されているキーを抽出 (例: raw._C619_C)
  const matches = txt.match(/raw\._[a-zA-Z0-9_]+/g);
  if (!matches) {
    console.log(`[SKIP] ${optionsFile} から参照キーを抽出できませんでした。`);
    return;
  }
  const explicitKeys = [...new Set(matches)].map(k => k.replace('raw.', ''));
  explicitKeys.push('_CASCADING_MAPS');

  // 抽出したキー、またはカスケード用のプレフィックスに一致するキーだけを残す
  const used = {};
  for (const k in data) {
    if (explicitKeys.includes(k) || cascadePrefixes.some(p => k.startsWith(p + '_'))) {
      used[k] = data[k];
    }
  }

  const beforeSize = fs.statSync(jsonPath).size;
  fs.writeFileSync(jsonPath, JSON.stringify(used, null, 2), 'utf8');
  const afterSize = fs.statSync(jsonPath).size;
  
  console.log(`[OK] ${file}`);
  console.log(`  Size: ${(beforeSize / 1024).toFixed(1)}KB -> ${(afterSize / 1024).toFixed(1)}KB`);
  console.log(`  Keys: ${Object.keys(data).length} -> ${Object.keys(used).length}`);
}

console.log('=== Dropdowns JSON 最適化 ===');

optimizeJson('dropdowns_renewal.json', 'renewalFormOptions.ts', [
  '_CC04', '_CA94', '_CC02_3', '_CB19', '_CB19_0', '_CC02_1', '_CC02_5', '_CC13_1', '_CC13_2', '_CC52_1'
]);

optimizeJson('dropdowns_change.json', 'changeFormOptions.ts', [
  '_CC04', '_CA94', '_CC02_3', '_CC23', '_CB19_1', '_CC52_1'
]);

console.log('完了しました。');
