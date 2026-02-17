"""
OpenRouter 経由で LLM を呼び出すクライアント
https://openrouter.ai/docs
OpenAI 互換 API のため、chat/completions 形式でリクエスト
"""

from __future__ import annotations

import json
from typing import Any

import httpx

from app.config import settings


class OpenRouterClient:
    """OpenRouter API クライアント（同期・非同期どちらも利用可能）"""

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
            "HTTP-Referer": "https://sleepsupport.app",  # アプリ識別用（任意）
        }

    async def chat(
        self,
        messages: list[dict[str, str]],
        *,
        temperature: float = 0,
        max_tokens: int = 2048,
    ) -> str:
        """
        チャット形式で LLM に問い合わせる。
        temperature=0 で再現性のある出力（週間プラン生成などに推奨）。

        Args:
            messages: [{"role": "user"|"assistant"|"system", "content": "..."}]
            temperature: 0〜2。0 で決定的。
            max_tokens: 最大トークン数。

        Returns:
            アシスタントの応答テキスト。

        Raises:
            httpx.HTTPStatusError: API エラー時。
            ValueError: API キー未設定時。
        """
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
        """
        LLM の応答を JSON としてパースして返す。
        週間睡眠プランなど「JSON で返して」とプロンプトで指定する用途向け。
        """
        raw = await self.chat(
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        # マークダウンのコードブロックを除去してからパース
        if raw.startswith("```"):
            lines = raw.split("\n")
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            raw = "\n".join(lines)
        return json.loads(raw)


# アプリ全体で使うシングルトン（Depends で上書き可能）
openrouter_client = OpenRouterClient()
