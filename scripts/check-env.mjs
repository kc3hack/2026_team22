#!/usr/bin/env node
/**
 * 開発環境のチェックスクリプト（初心者向け）
 * pnpm run setup で実行
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';

const requiredNodeVersion = 18;
let hasError = false;

function check(name, ok, message) {
  const icon = ok ? '✅' : '❌';
  console.log(`  ${icon} ${name}: ${message}`);
  if (!ok) hasError = true;
}

function run(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

console.log('\n🔧 開発環境チェック\n');

// Node.js
const nodeVersion = process.version.slice(1).split('.')[0];
const nodeOk = parseInt(nodeVersion, 10) >= requiredNodeVersion;
check('Node.js', nodeOk, `${process.version} ${nodeOk ? '' : `(v${requiredNodeVersion}以上が必要)`}`);

// pnpm
const pnpmVersion = run('pnpm --version');
check('pnpm', !!pnpmVersion, pnpmVersion ? `v${pnpmVersion}` : '未インストール (corepack enable または npm i -g pnpm)');

// Git
const gitVersion = run('git --version');
check('Git', !!gitVersion, gitVersion || '未インストール');

// Android SDK（オプション・エミュレーター用）
let adbOk = false;
try {
  execSync('adb --version', { stdio: 'pipe' });
  adbOk = true;
} catch {
  // 未設定時はスキップ
}
check('Android SDK', true, adbOk ? '設定済み (adb 使用可)' : '未設定 (Expo Go実機なら不要)');

// Java 17（Android ビルド用。expo run:android で必須）
let javaOk = false;
let javaVersion = '';
try {
  const javaHome = execSync('/usr/libexec/java_home -v 17 2>/dev/null', {
    encoding: 'utf8',
    shell: true,
  }).trim();
  if (javaHome) {
    const out = execSync('java -version 2>&1', {
      encoding: 'utf8',
      env: { ...process.env, JAVA_HOME: javaHome },
    });
    const m = out.match(/version "(\d+)/);
    javaVersion = m ? `Java ${m[1]}` : '17';
    javaOk = true;
  }
} catch {
  // Mac 以外や java_home がない場合はスキップ
}
check('Java 17', true, javaOk ? javaVersion : '未確認 (Android ビルド時は export JAVA_HOME=$(/usr/libexec/java_home -v 17) を推奨)');

// 依存関係
const nodeModulesOk = existsSync('node_modules');
check('依存関係', nodeModulesOk, nodeModulesOk ? 'インストール済み' : '未インストール (pnpm install を実行)');

console.log('');
if (hasError) {
  console.log('💡 対処法:');
  if (!nodeOk) console.log('   - Node.js: https://nodejs.org/ から LTS 版をインストール');
  if (!pnpmVersion) console.log('   - pnpm: ターミナルで corepack enable を実行');
  if (!nodeModulesOk) console.log('   - 依存関係: pnpm install を実行');
  console.log('');
  process.exit(1);
} else {
  console.log('✨ 環境は問題なさそうです！ pnpm start で開発を始めましょう。\n');
}
