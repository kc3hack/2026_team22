"""
OpenRouter 経由で LLM を呼び出すクライアント（IPlanGenerator のアダプター）
https://openrouter.ai/docs
"""

from __future__ import annotations

import json
import logging
from typing import Any, cast

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

# デバッグ用: LLM ペイロードログの最大文字数（超えたら省略表示）
LLM_PAYLOAD_LOG_MAX_CHARS = 12000


class OpenRouterClient:
    """OpenRouter API クライアント"""

    def __init__(
        self,
        api_key: str | None = None,
        base_url: str | None = None,
        model: str | None = None,
    ):
        self.api_key = api_key or settings.OPENROUTER_API_KEY
        self.base_url = base_url or settings.OPENROUTER_BASE_URL
        self.model = model or settings.OPENROUTER_MODEL
        self._chat_url = f"{self.base_url.rstrip('/')}/chat/completions"

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://sleepsupport.app",
        }

    async def chat(
        self,
        messages: list[dict[str, str]],
        *,
        temperature: float = 0,
        max_tokens: int = 2048,
    ) -> str:
        """チャット形式で LLM に問い合わせる"""
        if not self.api_key:
            raise ValueError("OPENROUTER_API_KEY が設定されていません")

        payload: dict[str, Any] = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                self._chat_url,
                headers=self._headers(),
                json=payload,
            )
            resp.raise_for_status()
            data = resp.json()

        choices = data.get("choices") or []
        if not choices:
            raise ValueError("OpenRouter が空の応答を返しました")
        content = choices[0].get("message", {}).get("content") or ""
        return content.strip()

    async def chat_json(
        self,
        messages: list[dict[str, str]],
        *,
        temperature: float = 0,
        max_tokens: int = 2048,
    ) -> dict[str, Any] | list[Any]:
        """LLM の応答を JSON としてパースして返す"""
        raw = await self.chat(
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        if raw.startswith("```"):
            lines = raw.split("\n")
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            raw = "\n".join(lines)
        return cast("dict[str, Any] | list[Any]", json.loads(raw))

    async def generate_week_plan(
        self,
        calendar_events: list[Any],
        sleep_logs: list[Any],
        settings: dict[str, Any],
        today_date: str | None = None,
    ) -> dict[str, Any]:
        """
        週間睡眠プランを生成する（IPlanGenerator の実装）
        settings に today_override が含まれる場合はプロンプトに明示して反映する。
        today_date は「今日」の日付（YYYY-MM-DD）。プロンプトと出力の基準日となる。
        """
        today_str = today_date or ""
        today_override = settings.get("today_override")
        user_content = (
            "以下を元に、このユーザー向けの「1週間の睡眠プラン」を JSON で返してください。\n"
            "タイムゾーンは Asia/Tokyo です。\n"
            "今日の日付は " + today_str + " です。この日を起点に、7日分のプランを作成してください。\n\n"
            "返却形式は必ず次の JSON のみにしてください（他に説明は不要、マークダウン修飾も不要）。\n"
            "{\n"
            '  "week_plan": [\n'
            '    { "date": "YYYY-MM-DD", "recommended_bedtime": "22:00", "recommended_wakeup": "06:30", '
            '"importance": "high|medium|low", "next_day_event": "翌日の主要予定またはnull", "advice": "短いアドバイス" },\n'
            "    ... 7日分（今日から7日間、date を必須で含める）\n"
            "  ]\n"
            "}\n\n"
            "ルール:\n"
            "- 各要素に date（YYYY-MM-DD）を必須で含める。曜日ではなく日付で返す。\n"
            "- importance: 翌日の予定の重要度。会議・試験・発表など重要な予定がある日は high、軽い予定は medium、予定なし・緩い日は low。\n"
            "- next_day_event: 翌日の最も重要な予定のタイトル。該当なければ null。\n"
            "- preparation_minutes が設定にある場合、起床から家を出る（または予定に取りかかる）までにその分数が必要。外出予定の開始時刻から逆算して起床時刻を決める。\n"
            "- 平日: 理想就寝 23:00、理想起床 6:00。ただし予定を優先。\n"
            "- 休日: 理想就寝 24:00、理想起床 8:00。平日の睡眠不足を補うよう長めの睡眠を提案。\n"
            "- 十分な睡眠が取れない日は、前後数日で睡眠時間を長めに取り補う。\n"
            "- 睡眠ログの評価（score）が悪い日は、実質的な睡眠時間が短い可能性があると解釈して提案。\n"
            "- mood（気分）が低い日が続く場合は、睡眠の質や量の改善をアドバイスに含める。\n\n"
            "カレンダー予定: " + json.dumps(calendar_events, ensure_ascii=False) + "\n\n"
            "睡眠ログ: " + json.dumps(sleep_logs, ensure_ascii=False) + "\n\n"
            "設定: " + json.dumps(settings, ensure_ascii=False)
        )
        if today_override:
            user_content += (
                "\n\n"
                "今日のオーバーライド（今日だけの就寝・起床時刻の変更）: "
                + json.dumps(today_override, ensure_ascii=False)
                + "\n上記のオーバーライドを今日の就寝・起床時刻に反映してください。"
            )
        messages = [
            {
                "role": "system",
                "content": (
                    "あなたは睡眠アドバイザーです。与えられた予定と睡眠ログから、"
                    "現実的な就寝・起床時刻と短いアドバイスを JSON 形式で返してください。"
                    "各日には date（YYYY-MM-DD）・importance・next_day_event を必ず含めてください。"
                ),
            },
            {"role": "user", "content": user_content},
        ]
        # デバッグ: LLM に投げるペイロード（プロンプト内容）をログ
        if len(user_content) <= LLM_PAYLOAD_LOG_MAX_CHARS:
            logger.info("plan llm payload (user_content): %s", user_content)
        else:
            logger.info(
                "plan llm payload (user_content, truncated): %s ... (truncated, total %d chars)",
                user_content[:LLM_PAYLOAD_LOG_MAX_CHARS],
                len(user_content),
            )
        result = await self.chat_json(
            messages=messages,
            temperature=0,
            max_tokens=2048,
        )
        if isinstance(result, dict) and "week_plan" in result:
            return result
        return {"week_plan": result} if isinstance(result, list) else {"week_plan": [result]}
