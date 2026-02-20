#!/usr/bin/env node
/**
 * 環境変数がコンテナに正しく渡っているか確認する。
 * 前提: task dev-up 済みで sleepsupport-api が起動していること。
 * 使い方: node scripts/check-env-applied.mjs
 */
import { execSync } from 'child_process';

const required = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_JWT_SECRET',
  'CORS_ORIGINS',
  'DATABASE_URL',
  'OPENROUTER_MODEL',
];
const optional = ['OPENROUTER_API_KEY', 'SUPABASE_SERVICE_ROLE_KEY'];

function getEnvInContainer() {
  try {
    const out = execSync(
      'docker exec sleepsupport-api env 2>/dev/null',
      { encoding: 'utf8' }
    );
    const env = {};
    for (const line of out.split('\n')) {
      const i = line.indexOf('=');
      if (i > 0) env[line.slice(0, i)] = line.slice(i + 1);
    }
    return env;
  } catch {
    return null;
  }
}

function mask(s) {
  if (!s || s.length < 8) return s ? '***' : '(空)';
  return s.slice(0, 4) + '...' + s.slice(-4);
}

console.log('\n📋 環境変数 適用確認（API コンテナ: sleepsupport-api）\n');

const env = getEnvInContainer();
if (!env) {
  console.log('❌ コンテナに接続できません。task dev-up で API を起動していますか？\n');
  process.exit(1);
}

let ok = true;
for (const key of required) {
  const v = env[key];
  const set = v != null && v !== '';
  if (!set) ok = false;
  const display = key === 'SUPABASE_JWT_SECRET' || key === 'SUPABASE_ANON_KEY' ? mask(v) : (v || '(空)');
  console.log(`  ${set ? '✅' : '❌'} ${key}: ${display}`);
}
console.log('');
for (const key of optional) {
  const v = env[key];
  const set = v != null && v !== '';
  const display = key === 'OPENROUTER_API_KEY' ? (set ? mask(v) : '(未設定・プランAPIのLLM呼び出しには必要)') : (v ? mask(v) : '(空)');
  console.log(`  ${set ? '✅' : '○'} ${key}: ${display}`);
}

console.log('\n※ Supabase 系は task dev-up の eval で渡されています。');
console.log('※ OPENROUTER_API_KEY は .env に書いておくと docker-compose 起動時に読み込まれます。\n');
process.exit(ok ? 0 : 1);
