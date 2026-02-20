#!/usr/bin/env node
/**
 * supabase status -o env の結果を、docker-compose に渡す用の export 文に変換して stdout に出す。
 * 使用例: eval "$(node scripts/supabase-env-for-compose.mjs)" && docker-compose up -d
 * Supabase が起動している必要あり。
 */
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function parseEnv(text) {
  const out = {};
  for (const line of text.split('\n')) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
  }
  return out;
}

function shEscape(val) {
  return "'" + String(val).replace(/'/g, "'\\''") + "'";
}

try {
  const out = execSync('pnpm exec supabase status -o env', {
    encoding: 'utf8',
    cwd: root,
  });
  const env = parseEnv(out);
  const apiUrl = env.API_URL || '';
  const anonKey = env.ANON_KEY || '';
  const jwtSecret = env.JWT_SECRET || '';
  const serviceRoleKey = env.SERVICE_ROLE_KEY || '';

  if (!apiUrl || !anonKey || !jwtSecret) {
    process.stderr.write('supabase-env-for-compose: API_URL/ANON_KEY/JWT_SECRET が取得できません。Supabase を起動してください。\n');
    process.exit(1);
  }

  // API コンテナからホストの Supabase に届くよう、localhost/127.0.0.1 を host.docker.internal に差し替える
  // （コンテナ内の 127.0.0.1 はコンテナ自身のため JWT 検証で 401 になる）
  const supabaseUrlForContainer = apiUrl.replace(/127\.0\.0\.1|localhost/, 'host.docker.internal');

  const vars = {
    SUPABASE_URL: supabaseUrlForContainer,
    SUPABASE_ANON_KEY: anonKey,
    SUPABASE_JWT_SECRET: jwtSecret,
    SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey,
    EXPO_PUBLIC_SUPABASE_URL: apiUrl,
    EXPO_PUBLIC_SUPABASE_ANON_KEY: anonKey,
  };

  for (const [k, v] of Object.entries(vars)) {
    console.log(`export ${k}=${shEscape(v)}`);
  }
  process.stderr.write('\n# フロント（pnpm start）用: 別ターミナルで同じ env が必要な場合\n');
  process.stderr.write(`# eval "$(node scripts/supabase-env-for-compose.mjs)"\n\n`);
} catch (_e) {
  process.stderr.write('supabase-env-for-compose: supabase status に失敗しました。先に task supabase-start を実行してください。\n');
  process.exit(1);
}
