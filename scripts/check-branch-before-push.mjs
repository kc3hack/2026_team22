#!/usr/bin/env node
/**
 * Push前にブランチの場所が正しいかチェックするスクリプト（Windows/Mac/Linux対応）
 * - 保護ブランチ（main, master）へのpush時に警告し、任意でpush可能
 * - 現在のブランチとpush先が一致するか確認
 * - リモートの直前コミットが他人の場合は警告し、任意でpush可能
 */

import { execSync } from 'child_process';
import { createInterface } from 'readline';
import { existsSync, createReadStream, readFileSync } from 'fs';

const PROTECTED_BRANCHES = ['main', 'master'];

function exec(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: 'pipe' }).trim();
  } catch {
    return '';
  }
}

function promptUser(message) {
  const ttyPath = process.platform === 'win32' ? 'CON' : '/dev/tty';
  return new Promise((resolve) => {
    const rejectPrompt = () => {
      if (!resolved) {
        resolved = true;
        resolve(false);
      }
    };
    let resolved = false;
    try {
      if (!existsSync(ttyPath)) {
        rejectPrompt();
        return;
      }
      const input = createReadStream(ttyPath);
      input.once('error', rejectPrompt);
      const rl = createInterface({ input, output: process.stdout });
      rl.once('error', rejectPrompt);
      rl.question(message, (answer) => {
        if (!resolved) {
          resolved = true;
          rl.close();
          resolve(/^[yY]|^[yY][eE][sS]$/.test(String(answer).trim()));
        }
      });
    } catch {
      rejectPrompt();
    }
  });
}

function askPushConfirmation() {
  return promptUser('   push しますか? [y/N]: ');
}

async function main() {
  const devNull = process.platform === 'win32' ? 'nul' : '/dev/null';
  const currentBranch = exec(`git symbolic-ref --short HEAD 2>${devNull}`);
  if (!currentBranch) {
    process.exit(0); // detached HEAD
  }

  const stdin = readFileSync(0, 'utf8');
  const lines = stdin.split(/\r?\n/).filter((line) => line.trim());
  for (const line of lines) {
    const [localRef, localSha, remoteRef, remoteSha] = line.split(/\s+/);
    if (!localRef) continue;

    const localBranch = localRef.replace(/^refs\/heads\//, '');
    const remoteBranch = remoteRef?.replace(/^refs\/heads\//, '') ?? '';

    // 保護ブランチチェック
    if (PROTECTED_BRANCHES.includes(remoteBranch)) {
      console.log('');
      console.log(`⚠️  警告: 保護ブランチ '${remoteBranch}' への直接pushです。`);
      console.log('');
      console.log('   feature ブランチを作成してから push することを推奨します:');
      console.log('   git checkout -b feature/your-feature-name');
      console.log('');
      const ok = await askPushConfirmation();
      if (!ok) {
        console.log('');
        console.log('   push を中止しました。');
        console.log('');
        process.exit(1);
      }
    }

    // ブランチ一致チェック
    if (localBranch !== currentBranch) {
      console.log('');
      console.log(`⚠️  警告: 現在のブランチ '${currentBranch}' と push 対象 '${localBranch}' が一致しません。`);
      console.log('');
      console.log('   意図した push か確認してください。');
      console.log('');
      process.exit(1);
    }

    // リモートの直前コミットが他人かチェック
    const zeroSha = '0'.repeat(40);
    if (remoteSha && remoteSha !== zeroSha) {
      try {
        execSync(`git cat-file -e ${remoteSha}`, { stdio: 'pipe' });
      } catch {
        continue;
      }
      const remoteAuthor = exec(`git log -1 --format=%ae ${remoteSha}`);
      const currentUser = exec('git config user.email');
      if (remoteAuthor && currentUser && remoteAuthor !== currentUser) {
        const remoteAuthorName = exec(`git log -1 --format=%an ${remoteSha}`);
        const currentUserName = exec('git config user.name');
        console.log('');
        console.log(`⚠️  警告: リモートブランチ '${remoteBranch}' の最新コミットは別の作者によるものです。`);
        console.log('');
        console.log(`   作者: ${remoteAuthorName} <${remoteAuthor}>`);
        console.log(`   あなた: ${currentUserName} <${currentUser}>`);
        console.log('');
        console.log('   相手が編集中の場合、競合が起きる可能性があります。');
        console.log('   git pull --rebase で取り込んでから push することを推奨します。');
        console.log('');
        const ok = await askPushConfirmation();
        if (!ok) {
          console.log('');
          console.log('   push を中止しました。');
          console.log('');
          process.exit(1);
        }
      }
    }
  }

  process.exit(0);
}

main();
