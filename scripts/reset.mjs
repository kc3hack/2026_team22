#!/usr/bin/env node
/**
 * プロジェクトをリセット（node_modules, .expo を削除して再インストール）
 * おかしくなったときに pnpm run reset
 */

import { rmSync, existsSync } from 'fs';
import { execSync } from 'child_process';

for (const dir of ['node_modules', '.expo']) {
  if (existsSync(dir)) {
    console.log(`削除中: ${dir}`);
    rmSync(dir, { recursive: true });
  }
}
console.log('pnpm install 実行中...');
execSync('pnpm install', { stdio: 'inherit' });
console.log('\n✅ リセット完了。pnpm start で再起動してください');
