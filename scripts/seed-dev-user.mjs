#!/usr/bin/env node
/**
 * 開発用: テストユーザー（example@example.com / example）を Supabase Auth に作成し、
 * バックエンド DB に users 行と過去6日分の睡眠ログを登録する。
 * 前提: pnpm supabase start 済み、マイグレーション済み。
 * 使用例: DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sleepsupport node scripts/seed-dev-user.mjs
 */
import { execSync, spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const SEED_EMAIL = 'example@example.com';
const SEED_PASSWORD = 'example';
const SEED_NAME = 'テストユーザー';

function parseSupabaseEnv(text) {
  const out = {};
  for (const line of text.split('\n')) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
  }
  return out;
}

function getSupabaseEnv() {
  try {
    const out = execSync('pnpm exec supabase status -o env', {
      encoding: 'utf8',
      cwd: root,
    });
    return parseSupabaseEnv(out);
  } catch (e) {
    console.error('seed-dev-user: supabase status に失敗しました。先に task supabase-start を実行してください。');
    process.exit(1);
  }
}

async function ensureSupabaseUser(apiUrl, serviceRoleKey) {
  const supabase = createClient(apiUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabase.auth.admin.createUser({
    email: SEED_EMAIL,
    password: SEED_PASSWORD,
    email_confirm: true,
  });

  if (!error) {
    console.log('Supabase Auth: テストユーザーを作成しました。', SEED_EMAIL);
    return data.user.id;
  }

  const msg = (error.message || '').toLowerCase();
  if (msg.includes('already') || msg.includes('registered') || error.status === 422) {
    const { data: signIn } = await supabase.auth.signInWithPassword({
      email: SEED_EMAIL,
      password: SEED_PASSWORD,
    });
    if (signIn?.user?.id) {
      console.log('Supabase Auth: 既存のテストユーザーを使用します。', SEED_EMAIL);
      return signIn.user.id;
    }
  }

  console.error('Supabase Auth ユーザー作成エラー:', error.message);
  process.exit(1);
}

function runSeedPython(userId) {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('seed-dev-user: DATABASE_URL が未設定です。');
    process.exit(1);
  }

  const result = spawnSync(
    'uv',
    ['run', 'python', 'scripts/seed_dev_data.py'],
    {
      cwd: join(root, 'backend'),
      env: {
        ...process.env,
        SEED_USER_ID: userId,
        SEED_EMAIL,
        SEED_NAME,
        DATABASE_URL: databaseUrl,
      },
      stdio: 'inherit',
    }
  );

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

async function main() {
  const env = getSupabaseEnv();
  const apiUrl = env.API_URL || '';
  const serviceRoleKey = env.SERVICE_ROLE_KEY || '';

  if (!apiUrl || !serviceRoleKey) {
    console.error('seed-dev-user: API_URL または SERVICE_ROLE_KEY が取得できません。');
    process.exit(1);
  }

  const userId = await ensureSupabaseUser(apiUrl, serviceRoleKey);
  runSeedPython(userId);
  console.log('シード完了: テストユーザーと過去6日分の睡眠ログを登録しました。');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
