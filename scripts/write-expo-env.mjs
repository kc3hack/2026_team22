#!/usr/bin/env node
/**
 * Supabase ローカルの接続情報を .env.expo.local に書く（Expo ローカル用。app.config.js で読み込む）。
 * task dev-up から呼ぶ。Supabase が起動している必要あり。
 * EXPO_PUBLIC_API_URL は実機・エミュレータから接続できるよう LAN IP を使う（localhost だとネットワークエラーになる）。
 */
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { networkInterfaces } from 'os';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

/** 実機・エミュレータから接続できるホストの IPv4 を取得（LAN の先頭アドレス）。 */
function getLocalNetworkIp() {
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) return net.address;
    }
  }
  return 'localhost';
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const envPath = join(root, '.env.expo.local');

const KEYS = [
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  'EXPO_PUBLIC_API_URL',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_JWT_SECRET',
  'SUPABASE_SERVICE_ROLE_KEY',
];

function parseEnv(text) {
  const out = {};
  for (const line of text.split('\n')) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
  }
  return out;
}

function main() {
  let statusEnv;
  try {
    const out = execSync('pnpm exec supabase status -o env', {
      encoding: 'utf8',
      cwd: root,
    });
    statusEnv = parseEnv(out);
  } catch (_e) {
    process.stderr.write('write-expo-env: supabase status に失敗しました。先に task supabase-start を実行してください。\n');
    process.exit(1);
  }

  const apiUrl = statusEnv.API_URL || '';
  const anonKey = statusEnv.ANON_KEY || '';
  const jwtSecret = statusEnv.JWT_SECRET || '';
  const serviceRoleKey = statusEnv.SERVICE_ROLE_KEY || '';

  const rawApi = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
  const apiHost = /localhost|127\.0\.0\.1/.test(rawApi)
    ? `http://${getLocalNetworkIp()}:8000`
    : rawApi;
  const newVars = {
    EXPO_PUBLIC_SUPABASE_URL: apiUrl,
    EXPO_PUBLIC_SUPABASE_ANON_KEY: anonKey,
    EXPO_PUBLIC_API_URL: apiHost, // 実機・エミュレータ用に localhost なら LAN IP に変換済み
    SUPABASE_URL: apiUrl,
    SUPABASE_ANON_KEY: anonKey,
    SUPABASE_JWT_SECRET: jwtSecret,
    SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey,
  };

  let content = existsSync(envPath) ? readFileSync(envPath, 'utf8') : '';

  const lines = content.split('\n');
  const out = [];
  const replaced = new Set();

  for (const line of lines) {
    const key = line.split('=')[0].trim();
    if (KEYS.includes(key)) {
      if (!replaced.has(key)) {
        out.push(`${key}=${newVars[key] ?? ''}`);
        replaced.add(key);
      }
      continue;
    }
    out.push(line);
  }

  for (const k of KEYS) {
    if (!replaced.has(k)) out.push(`${k}=${newVars[k] ?? ''}`);
  }

  writeFileSync(envPath, out.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n', 'utf8');
  console.log('write-expo-env: .env.expo.local を更新しました（Expo ローカル用）。');
}

main();
