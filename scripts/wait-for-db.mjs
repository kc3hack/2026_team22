#!/usr/bin/env node
/**
 * docker-compose の db サービスが pg_isready で応答するまで最大 60 秒ポーリングする。
 * Windows / macOS / Linux で動作。使用例: node scripts/wait-for-db.mjs
 * 注意: プロジェクトルートで実行すること（docker-compose が同じディレクトリで動く想定）。
 */
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const isWindows = process.platform === 'win32';
const maxAttempts = 60;
const sleepSec = 1;

function run(cmd, options = {}) {
  try {
    return execSync(cmd, {
      encoding: 'utf8',
      cwd: root,
      shell: true, // ターミナルと同じ PATH/環境で docker を解決（Task 経由でも確実に動くように）
      stdio: ['pipe', 'pipe', 'pipe'],
      ...options,
    }).trim();
  } catch (_e) {
    return null;
  }
}

function sleep() {
  if (isWindows) {
    run('timeout /t ' + sleepSec + ' /nobreak > nul', { stdio: 'ignore' });
  } else {
    run('sleep ' + sleepSec, { stdio: 'ignore' });
  }
}

// docker-compose.yml の db.container_name と一致させる（ID は改行等で不具合が出ることがあるため名前で指定）
const DB_CONTAINER_NAME = 'sleepsupport-db';

console.log('DB 起動待機...');
// Docker Compose V2 (docker compose) を優先、無ければ V1 (docker-compose)
const composeCmd = run('docker compose version') ? 'docker compose' : 'docker-compose';
const out = run(composeCmd + ' ps -q db');
const idFromCompose = out ? out.split(/\r?\n/)[0].trim().replace(/\s/g, '') : '';
if (!idFromCompose) {
  console.error('DB コンテナが見つかりません（docker compose ps -q db が空です）');
  process.exit(1);
}

for (let i = 1; i <= maxAttempts; i++) {
  // stdio は pipe のまま（ignore にすると docker exec がブロックすることがある）
  const ok = run('docker exec ' + DB_CONTAINER_NAME + ' pg_isready -U postgres');
  if (ok !== null) {
    console.log('DB は接続可能になりました。');
    process.exit(0);
  }
  if (i === maxAttempts) {
    console.error('タイムアウト: DB が 60 秒以内に起動しませんでした。');
    process.exit(1);
  }
  sleep();
}
