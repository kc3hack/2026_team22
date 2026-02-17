#!/bin/bash
# CRUD API 手動テストスクリプト
# 前提: docker compose up -d で API と DB が起動していること

set -e
BASE_URL="${API_URL:-http://localhost:8000/api/v1}"
EMAIL="test-$(date +%s)@example.com"

echo "=== SleepSupportApp CRUD テスト ==="
echo "API: $BASE_URL"
echo ""

# ヘルスチェック
echo "1. ヘルスチェック"
curl -s "$BASE_URL/health" | jq . 2>/dev/null || curl -s "$BASE_URL/health"
echo -e "\n"

# Create
echo "2. Create (POST /users)"
CREATE_RES=$(curl -s -X POST "$BASE_URL/users" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"name\": \"テストユーザー\"}")
echo "$CREATE_RES" | jq . 2>/dev/null || echo "$CREATE_RES"

USER_ID=$(echo "$CREATE_RES" | jq -r '.id')
if [ "$USER_ID" = "null" ] || [ -z "$USER_ID" ]; then
  echo "ERROR: ユーザー作成に失敗しました"
  exit 1
fi
echo -e "\n"

# Read (単体)
echo "3. Read (GET /users/$USER_ID)"
curl -s "$BASE_URL/users/$USER_ID" | jq .
echo -e "\n"

# Read (一覧)
echo "4. Read All (GET /users)"
curl -s "$BASE_URL/users" | jq .
echo -e "\n"

# Update
echo "5. Update (PUT /users/$USER_ID)"
curl -s -X PUT "$BASE_URL/users/$USER_ID" \
  -H "Content-Type: application/json" \
  -d '{"name": "更新後の名前"}' | jq .
echo -e "\n"

# Read (更新確認)
echo "6. Read 更新確認"
curl -s "$BASE_URL/users/$USER_ID" | jq .
echo -e "\n"

# Delete
echo "7. Delete (DELETE /users/$USER_ID)"
curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE_URL/users/$USER_ID"
echo " (204 expected)"
echo -e "\n"

# Read (404確認)
echo "8. Read 削除後 (404期待)"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/users/$USER_ID")
echo "HTTP $HTTP_CODE (404 expected)"

if [ "$HTTP_CODE" = "404" ]; then
  echo -e "\n✅ 全CRUDテスト成功"
else
  echo -e "\n❌ 削除後の取得が404ではありません (got: $HTTP_CODE)"
  exit 1
fi
