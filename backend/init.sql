-- SleepSupportApp 初期データベース設定
-- このファイルはPostgreSQLコンテナ起動時に自動実行されます

-- 拡張機能を有効化
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 基本的なテーブル構造（必要に応じて拡張）
-- 例: ユーザーテーブル
-- CREATE TABLE IF NOT EXISTS users (
--     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     email VARCHAR(255) UNIQUE NOT NULL,
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
-- );

-- 例: 睡眠記録テーブル
-- CREATE TABLE IF NOT EXISTS sleep_records (
--     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     user_id UUID REFERENCES users(id) ON DELETE CASCADE,
--     sleep_start TIMESTAMP WITH TIME ZONE NOT NULL,
--     sleep_end TIMESTAMP WITH TIME ZONE,
--     quality_score INTEGER CHECK (quality_score >= 1 AND quality_score <= 10),
--     notes TEXT,
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
-- );

-- 開発用メッセージ
DO $$
BEGIN
    RAISE NOTICE 'SleepSupportApp database initialized successfully!';
END $$;
