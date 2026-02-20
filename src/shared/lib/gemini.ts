/**
 * Gemini API クライアント（スタブ実装）
 *
 * Step 1: プレースホルダーメッセージを返す
 * Step 3: 実際のGemini 1.5 Pro APIに接続
 *
 * 使用例:
 * ```typescript
 * import { geminiClient } from '@shared/lib/gemini';
 * const message = await geminiClient.generateWarning('phase1', 'high', events);
 * ```
 */

import type { EventImportance } from '@features/sleep-monitor/types';

interface GeminiConfig {
  apiKey?: string;
  model?: string;
}

interface WarningContext {
  /** 現在のフェーズ */
  phase: 'phase1' | 'phase2';
  /** 予定の重要度 */
  importance: EventImportance;
  /** 使用時間（分） */
  usageMinutes: number;
  /** 明日の予定一覧 */
  tomorrowEvents?: string[];
}

class GeminiClient {
  private config: GeminiConfig;

  constructor(config: GeminiConfig = {}) {
    this.config = {
      model: 'gemini-1.5-pro',
      ...config,
    };
  }

  /** 設定を更新 */
  configure(config: Partial<GeminiConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * スマホ操作警告メッセージを生成
   * Step 1ではテンプレートメッセージを返す
   */
  async generateWarning(context: WarningContext): Promise<string> {
    // TODO: Step 3で実際のGemini API呼び出しに置き換え
    console.warn('[Gemini] Warning generation requested:', context);

    if (context.phase === 'phase1') {
      if (context.importance === 'high') {
        const event = context.tomorrowEvents?.[0] ?? '重要な予定';
        return `明日は「${event}」がありますよ。もう${context.usageMinutes}分もスマホを触っています。今すぐ画面を閉じて、明日に備えてください。`;
      }
      return `就寝まであと30分です。${context.usageMinutes}分もスマホを使っています。そろそろ画面を置いて、リラックスしましょう。`;
    }

    // Phase 2: より厳しい警告
    if (context.importance === 'high') {
      const event = context.tomorrowEvents?.[0] ?? '重要な予定';
      return `⚠️ 警告：リミットを超えました。明日の「${event}」のパフォーマンスが低下します。直ちに就寝準備に入ってください。`;
    }
    return `⚠️ 警告：リミットを超えました。このままでは明日のパフォーマンスが30%低下します。直ちに就寝準備に入ってください。`;
  }

  /**
   * 環境改善アドバイスを生成
   */
  async generateEnvironmentAdvice(
    lightLux: number | null,
    noiseDb: number | null
  ): Promise<string> {
    // TODO: Step 3で実際のGemini API呼び出しに置き換え
    const messages: string[] = [];

    if (lightLux !== null && lightLux >= 30) {
      messages.push('部屋がまだ明るすぎます。間接照明も消しましょう。');
    }
    if (noiseDb !== null && noiseDb >= 45) {
      messages.push('周囲の音が大きいです。静かな環境を整えましょう。');
    }

    return messages.length > 0 ? messages.join('\n') : '睡眠環境は良好です。おやすみなさい。';
  }

  /**
   * ミッション画像の判定 (Gemini Vision API)
   * 指定された画像にターゲット（targetLabel）が写っているか判定する
   */
  async verifyMissionImage(base64Image: string, targetLabel: string): Promise<boolean> {
    // ユーザー指定: APIキーは空欄
    const apiKey = 'AIzaSyC0DXZJYdoNm5iMTaKapC90ER8vLrXacAk';
    // const apiKey = this.config.apiKey || '';

    if (!apiKey) {
      console.warn('⚠️ Gemini API Key is missing. Please set it in src/shared/lib/gemini.ts');
      // APIキーがない場合はデバッグ用に成功とするか、エラーにするか。
      // ここではユーザーの意図（AIで判別）を尊重し、キーがないと動作しない（false）とするが、
      // 動作確認のためにログを出す。
      return false;
    }

    // 高速なFlash Liteモデルを使用
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;

    const body = {
      contents: [
        {
          parts: [
            { text: `Does this image show a "${targetLabel}"? Answer strictly with YES or NO.` },
            {
              inline_data: {
                mime_type: 'image/jpeg',
                data: base64Image,
              },
            },
          ],
        },
      ],
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.error) {
        console.error('Gemini API Error:', data.error);
        return false;
      }

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toUpperCase();
      console.log(`[Gemini Vision] Target: ${targetLabel}, Result: ${text}`);

      return text?.includes('YES');
    } catch (error) {
      console.error('Gemini Verification Integration Failed:', error);
      return false;
    }
  }
}

// シングルトンインスタンス
export const geminiClient = new GeminiClient();

export type { GeminiConfig, WarningContext };
