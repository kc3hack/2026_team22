/**
 * LLM (Large Language Model) クライアント
 *
 * TODO: 実際のLLMサービス（OpenAI, Gemini等）に接続
 *
 * 使用例:
 * ```typescript
 * import { llmClient } from '@shared/lib/llm';
 * const response = await llmClient.chat('睡眠の質を改善するアドバイスをください');
 * ```
 */

interface LLMConfig {
  apiKey?: string;
  model?: string;
  maxTokens?: number;
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatResponse {
  message: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
  };
}

class LLMClient {
  private config: LLMConfig;

  constructor(config: LLMConfig = {}) {
    this.config = {
      model: 'gpt-4',
      maxTokens: 1000,
      ...config,
    };
  }

  /**
   * LLMの設定を更新
   */
  configure(config: Partial<LLMConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * チャット形式でLLMに問い合わせ
   */
  async chat(prompt: string, systemPrompt?: string): Promise<ChatResponse> {
    // TODO: 実際のAPI呼び出しを実装
    console.warn('[LLM] Chat request:', { prompt, systemPrompt });

    // プレースホルダー: 実装時に置き換え
    return {
      message: `[LLM Response Placeholder] あなたのメッセージ: "${prompt}"`,
    };
  }

  /**
   * 会話履歴を使ってチャット
   */
  async chatWithHistory(messages: ChatMessage[]): Promise<ChatResponse> {
    // TODO: 実際のAPI呼び出しを実装
    console.warn('[LLM] Chat with history:', messages);

    return {
      message: '[LLM Response Placeholder]',
    };
  }
}

// シングルトンインスタンス
export const llmClient = new LLMClient();

export type { LLMConfig, ChatMessage, ChatResponse };
