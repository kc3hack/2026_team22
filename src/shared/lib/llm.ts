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

// 以下の条件に従い、今後一週間の起床時間と入眠時刻を提案してください。
//     - 起床から家を出る、または自宅での予定に取りかかるまでには、準備として最低${}時間、理想的には${}時間が必要です。
//     - 帰宅から就寝までは、就寝準備として最低${}時間、理想的には${}時間が必要です。
//     - 家からの通学時間または通勤時間は${}時間です。
//     - 「オンライン」と記載されている予定は、通学時間または通勤時間は必要ありません。
//     - 自宅の位置は${}です。この情報を元に、職場または学校以外の場所への移動時間を推定してください。
//     - 理想的な睡眠時間は7-8時間です。
//     - 平日の理想的な就寝時刻は23:00、理想的な起床時刻は6:00です。ただし、予定を優先してください。
//     - 休日の理想的な就寝時刻は24:00、理想的な起床時刻は8:00です。ただし、その週の平日の睡眠不足が短くなった場合は、それを補うよう長め睡眠を取るよう提案してください。
//     - 十分な睡眠が取れない場合は、前後数日の睡眠時間を長めに取り、睡眠不足を補うようにしてください。
//     - 以下は今月の予定です。予定はICS形式で提供されます。${googleカレンダーデータ埋め込み}
//     - 以下は過去1週間の睡眠時間の記録です。${過去1週間の睡眠時間の記録埋め込み}睡眠時刻が不足している場合は、それを補うように提案してください。十分な睡眠時間が取れている日でも、睡眠記録の評価が悪い場合は、実際の睡眠時間よりも短い睡眠しか取れていない可能性があると考えて提案してください。

//     提案する起床時刻と就寝時刻、簡潔なアドバイスについて、以下のjson形式に従って出力してください。
//     dateは予定の日付を、dayは曜日を、wake_upは起床時刻を、bed_timeは就寝時刻を、sleep_durationは睡眠時間を、adviceはその日の予定を受けての睡眠に関するアドバイスを簡潔に記載してください。
//     起床時刻と就寝時刻はISO 8601表記で、曜日は月~金までの漢字一文字で、睡眠時間は「時間:分」の形式で記載してください。

//     {
//         "weekly_schedule": [
//             {
//                 "date": "YYYY-MM-DD",
//                 "day": "曜日",
//                 "wake_up": "HH:MM",
//                 "bed_time": "HH:MM",
//                 "sleep_duration": "HH:MM",
//                 "advice": "その日の予定を受けての睡眠に関するアドバイスを簡潔に記載してください。"
//             }
//         ]
//     }

//     **出力はjson形式のみを返してください。マークダウンによる修飾も不要です。プレーンテキストで返してください**
