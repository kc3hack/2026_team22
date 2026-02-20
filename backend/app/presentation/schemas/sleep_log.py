"""睡眠ログ Pydantic スキーマ"""

from __future__ import annotations

import datetime as dt

from pydantic import BaseModel, Field


class SleepLogCreate(BaseModel):
    date: dt.date = Field(..., description="記録日 YYYY-MM-DD")
    score: int = Field(..., ge=0, le=100, description="睡眠スコア 0-100")
    scheduled_sleep_time: dt.datetime | None = Field(None, description="予定就寝時刻")
    usage_penalty: int = Field(0, ge=0, description="使用ペナルティ")
    environment_penalty: int = Field(0, ge=0, description="環境ペナルティ")
    phase1_warning: bool = Field(False, description="Phase1 警告")
    phase2_warning: bool = Field(False, description="Phase2 警告")
    light_exceeded: bool = Field(False, description="照度超過")
    noise_exceeded: bool = Field(False, description="騒音超過")
    mood: int | None = Field(None, ge=1, le=5, description="気分 1-5")


class SleepLogMoodUpdate(BaseModel):
    mood: int = Field(..., ge=1, le=5, description="気分 1-5")


class SleepLogResponse(BaseModel):
    id: str
    user_id: str
    date: dt.date
    score: int
    scheduled_sleep_time: dt.datetime | None
    usage_penalty: int
    environment_penalty: int
    phase1_warning: bool
    phase2_warning: bool
    light_exceeded: bool
    noise_exceeded: bool
    mood: int | None
    created_at: dt.datetime

    model_config = {"from_attributes": True}


class SleepLogListResponse(BaseModel):
    logs: list[SleepLogResponse]
    total: int
