"""
OpenRouter 経由で LLM を呼び出すクライアント（IPlanGenerator のアダプター）
https://openrouter.ai/docs
"""

from __future__ import annotations

import json
from typing import Any

import httpx

from app.config import settings


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
        return json.loads(raw)

    async def generate_week_plan(
        self,
        calendar_events: list[Any],
        sleep_logs: list[Any],
        settings: dict[str, Any],
        today_override: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """
        週間睡眠プランを生成する（IPlanGenerator の実装）
        todayOverride がある場合はプロンプトに含め、今日だけの就寝・起床時刻を反映する。
        """
        user_content = (
            "以下を元に、このユーザー向けの「1週間の睡眠プラン」を JSON で返してください。\n"
            "返却形式は必ず次の JSON のみにしてください（他に説明は不要）。\n"
            "{\n"
            '  "week_plan": [\n'
            '    { "day": "月曜", "recommended_bedtime": "22:00", "recommended_wakeup": "06:30", "advice": "短いアドバイス" },\n'
            "    ... 7日分\n"
            "  ]\n"
            "}\n\n"
            "カレンダー予定: "
            + json.dumps(calendar_events, ensure_ascii=False)
            + "\n\n"
            "睡眠ログ: "
            + json.dumps(sleep_logs, ensure_ascii=False)
            + "\n\n"
            "設定: "
            + json.dumps(settings, ensure_ascii=False)
        )
        if today_override is not None:
            user_content += (
                "\n\n"
                "今日のオーバーライド（今日だけの就寝・起床時刻の変更）: "
                + json.dumps(today_override, ensure_ascii=False)
                + "\n上記のオーバーライドを今日の就寝・起床時刻に反映してください。"
            )
        messages = [
            {
                "role": "system",
                "content": "あなたは睡眠アドバイザーです。与えられた予定と睡眠ログから、現実的な就寝・起床時刻と短いアドバイスを JSON 形式で返してください。",
            },
            {"role": "user", "content": user_content},
        ]
        result = await self.chat_json(
            messages=messages,
            temperature=0,
            max_tokens=2048,
        )
        if isinstance(result, dict) and "week_plan" in result:
            return result
        return (
            {"week_plan": result}
            if isinstance(result, list)
            else {"week_plan": [result]}
        )
