# 実装方針・設計ルール

## ファイル構成

- 全コードは `index.html` 1ファイルに集約する
- 外部CSS・JSファイルの新規作成禁止
- 外部ライブラリ・CDN追加禁止（Vanilla JSのみ）

## 状態管理

- グローバル状態変数はスクリプト先頭にまとめて宣言する
- ユーザー設定の取得は必ず `getConfig()` 経由で行う（`cfg.highPrice` 等の直接参照禁止）
- LocalStorageの優先順位：`localStorage.getItem()` > `getConfig()` のデフォルト値

## Canvas描画

- Canvas描画は必ず `renderCanvas()` 経由で呼び出す
- `canvas.offsetWidth` / `getBoundingClientRect()` の直接使用禁止（非表示時に0になるため）
- Canvasサイズは `window.innerWidth` から算出する

## NISA枠チェック（必須）

追加入金を記録する処理には必ず以下を実装する：

1. **年間成長投資枠**：その年の成長枠使用額 + 入力金額 ≤ 240万円
2. **生涯投資枠**：累計使用額 + 入力金額 ≤ 1,800万円
3. エラー時は処理をブロックし、残り枠をトーストで表示する

> Supabase導入後はサーバーサイドでも二重チェックを実装する

## 機密情報の管理

- APIキー・メールアドレス・シークレットはコードに直接書かない
- 現在の技術的負債（要対応）：
  - GASデプロイIDが `index.html` にハードコード → Netlify環境変数へ移行
  - 通知先メールアドレスがGASにハードコード → GAS PropertiesServiceへ移行
- GitHubリポジトリをPrivateにする際は、先にハードコードされた機密情報を除去する

## Supabase導入時の追加ルール（将来）

- RLS（Row Level Security）を全テーブルで必ず有効化する
- JWTトークンは `httpOnly Cookie` で管理する（LocalStorageへの保存禁止）
- クライアントから直接SQLを実行しない（Edge Functions経由）
- Supabase URLとAnon Keyは Netlify環境変数で管理する
  ```
  SUPABASE_URL=https://xxxx.supabase.co
  SUPABASE_ANON_KEY=eyJxxx...
  ```
