# コーディング規約

## JavaScript

- `const` / `let` のみ使用。`var` 禁止
- 状態変数はスクリプト先頭で宣言する（`let` のhoistingエラー防止）
- 関数は以下のカテゴリコメントで区切る
  ```
  // ── データ管理 ──
  // ── 計算ロジック ──
  // ── 描画・UI ──
  // ── 操作・イベント ──
  // ── 初期化 ──
  ```
- `eval()` 禁止
- ユーザー入力は必ず `parseInt()` / `parseFloat()` で変換し `NaN` チェックを行う
- 数値入力のバリデーションは関数の先頭で行う

## CSS

- カラーは必ずCSSカスタムプロパティを使用する。カラーコードの直接記述禁止
  ```css
  --green: #1a6b4a;  --green-light: #e8f5ee;
  --gold: #c8922a;   --red: #d94f3d;
  --teal: #5a9e98;
  ```
- `max-width: 430px` と `safe-area-inset` 対応を維持する

## HTML

- `innerHTML` への直接代入は禁止（XSS対策）。動的テキストは `textContent` を使う
- ただしHTMLテンプレートを生成する場合は、ユーザー入力値を必ずエスケープしてから使用する

## 命名規則

| 対象 | 規則 | 例 |
|------|------|-----|
| 関数名 | キャメルケース | `calcTsumitateForYear` |
| 変数名 | キャメルケース | `highPrice`, `basePrice` |
| LocalStorageキー | ケバブケース | `nisa-high-price` |
| CSS変数 | ケバブケース | `--green-light` |
| IDセレクタ | ケバブケース | `dip-alert-banner` |
