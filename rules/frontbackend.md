# フロント・バック（DB）の規約

## フロントエンド規約

### LocalStorage

- キー名はすべて `nisa-` プレフィックスを付ける
- 機密情報（APIキー・パスワード・トークン）の保存禁止
- 保存するデータは以下に限定する

| キー | 型 | 内容 |
|------|----|------|
| `nisa-user-config` | JSON | ユーザー基本設定 |
| `nisa-tsumitate-history` | JSON配列 | 積立額変更履歴 |
| `nisa-dip-history` | JSON配列 | 追加入金履歴 |
| `nisa-base-price` | 数値文字列 | 現在の基準価格 |
| `nisa-high-price` | 数値文字列 | 高値基準価格 |
| `nisa-last-notif-*` | 日付文字列 | 通知済みフラグ（1日1回制限） |

### PWA

- Service Worker（`sw.js`）のキャッシュバージョンを変更時は更新する
  ```javascript
  const CACHE_NAME = 'nisa-v2'; // 変更時はバージョンアップ
  ```
- `manifest.json` のアイコン・テーマカラーはアプリのデザインに合わせる

### ブラウザ通知

- 通知許可はユーザーの明示的な操作によってのみ取得する（自動取得禁止）
- 同一内容の通知は1日1回に制限する（`nisa-last-notif-*` で管理）

---

## バックエンド規約（GAS・現在）

### GAS APIルール

- エンドポイントは `doGet(e)` のみ公開する
- レスポンスは必ずJSON形式で返す
- 高値基準価格は `e.parameter.highPrice` で受け取り `PropertiesService` に保存する
- メールアドレスはコードにハードコードせず `PropertiesService` で管理する（移行予定）
- スクレイピング対象（SBI証券）のHTML構造変更に備えて、取得失敗時は `error` フィールドを返す

### GASトリガー

- `dailyCheck()` 関数で毎朝8〜9時に自動実行する
- 通知済みフラグ（`last_notif_*`）は `PropertiesService` で管理し、1日1通のみ送信する

---

## バックエンド規約（Supabase・将来）

### DB設計

- 全テーブルに `user_id` カラムを設け、RLSで自分のデータのみアクセス可能にする
- テーブル名・カラム名はスネークケースを使用する（例：`tsumitate_history`）
- 論理削除（`deleted_at`）を採用する（物理削除は原則禁止）

### RLS（必須）

```sql
-- 例：tsumitate_historyテーブルのRLS
ALTER TABLE tsumitate_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "自分のデータのみ参照可能"
ON tsumitate_history FOR ALL
USING (auth.uid() = user_id);
```

### APIキー管理

- `SUPABASE_URL` と `SUPABASE_ANON_KEY` はNetlify環境変数で管理する
- Service Key（管理者権限）はサーバーサイドのみで使用し、クライアントに公開しない

### データ移行（LocalStorage → Supabase）

- 移行時はLocalStorageの既存データをSupabaseにインポートする処理を実装する
- 移行完了後もLocalStorageをキャッシュとして残し、オフライン対応を維持する

### 認証

- Supabase Authを使用する
- JWTトークンは `httpOnly Cookie` で管理する（LocalStorageへの保存禁止）
- 未認証ユーザーはデータの読み書き不可とする
