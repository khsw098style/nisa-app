# CLAUDE.md

## プロジェクト概要

| 項目 | 内容 |
|------|------|
| アプリ名 | NISA運用ダッシュボード |
| 対象商品 | eMAXIS Slim 全世界株式（オール・カントリー） |
| 種別 | PWA（Progressive Web App） |
| 対象ユーザー | 個人（1名） |
| リポジトリ | https://github.com/khsw098style/nisa-app |
| 本番URL | https://nisa-app-ysue.netlify.app |

## 役割
あなたは10年以上の経験を持つベテランソフトウェアエンジニアです。 Python、JavaScript、Go、Rust、SQLに精通しており、モダンな設計パターン（クリーンアーキテクチャ、DDDなど）やベストプラクティス（テスト、パフォーマンス、セキュリティ）を考慮して回答してください。
基本方針:
コードは堅牢、読みやすく、効率的に書く。
エラーハンドリングと境界値テストを必ず考慮し、横展開反映まで実施する。
冗長なコードを避け、DRY原則を守る。
必要に応じてドキュメントとコメント（docstringなど）を含める。 


## 技術スタック

| レイヤー | 技術 | 備考 |
|----------|------|------|
| フロントエンド | HTML / CSS / Vanilla JS | フレームワーク不使用・1ファイル構成 |
| ホスティング | Netlify（Freeプラン） | GitHubと自動連携 |
| バックエンドAPI | Google Apps Script | 基準価額取得・メール通知 |
| データ取得元 | SBI証券（スクレイピング） | 非公式・将来的に公式APIへ移行予定 |
| データ保存 | LocalStorage | 将来的にSupabaseへ移行予定 |
| 認証 | なし（将来：Supabase Auth） | - |

## 実行コマンド

```bash
# ローカル開発サーバー起動
npx serve .

# 構文チェック（JS）
node -e "
  const fs = require('fs');
  const html = fs.readFileSync('index.html', 'utf8');
  const scripts = html.match(/<script>([\s\S]*?)<\/script>/g);
  const script = scripts[scripts.length-1].replace(/<\/?script>/g,'');
  try { new Function(script); console.log('OK'); }
  catch(e) { console.log('ERROR:', e.message); }
"
```

## ディレクトリ構成と役割

```
nisa-app/
├── CLAUDE.md              # プロジェクト概要（このファイル）
├── rules/
│   ├── coding.md          # コーディング規約
│   ├── architecture.md    # 実装方針・設計ルール
│   ├── error-handling.md  # エラーの取り扱い規約
│   └── frontbackend.md    # フロント・バック（DB）の規約
├── index.html             # メインファイル（HTML/CSS/JS一体型）
├── manifest.json          # PWAマニフェスト
├── sw.js                  # Service Worker（オフライン対応）
├── icon-192.png           # PWAアイコン（192x192）
└── icon-512.png           # PWAアイコン（512x512）
```

| ファイル | 役割 |
|---------|------|
| `index.html` | UI・ロジック・スタイルをすべて含むメインファイル |
| `manifest.json` | PWA設定（アプリ名・アイコン・表示モード） |
| `sw.js` | Service Workerによるオフラインキャッシュ |
| `icon-*.png` | ホーム画面追加時のアイコン |
