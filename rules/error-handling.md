# エラーの取り扱い規約

## 基本方針

- エラーはユーザーに**わかりやすい日本語**でトーストまたはバナーで通知する
- エラー発生時は**処理を中断**し、不正なデータをLocalStorageに保存しない
- `console.error` はデバッグ用途のみ。本番コードでは `console.log` に留める

## ユーザー入力エラー

```javascript
// NG：何も伝えない
if (!amount) return;

// OK：理由と残り枠を明示する
if (!amount || amount < 1) {
  showToast('入金額を入力してください');
  return;
}
```

- エラーメッセージには**残り枠・具体的な数値**を含める
  ```
  ❌ 年間成長投資枠超過！2026年の残り 1,200,000円まで
  ❌ 生涯投資枠超過！残り 15,600,000円まで
  ```

## 外部API（GAS）エラー

- `fetchLatestPrice()` は `try/catch` で必ず囲む
- 取得失敗時はLocalStorageの保存値を使い、ユーザーには通知しない（サイレントフォールバック）
- エラー内容は `console.log` で記録する

```javascript
async function fetchLatestPrice() {
  try {
    // ...
  } catch(e) {
    console.log('価格取得失敗:', e.message);
    // フォールバック：保存済みの値をそのまま使用
  }
}
```

## LocalStorageエラー

- `JSON.parse` は必ず `try/catch` で囲む
- パース失敗時はデフォルト値（`null` または `[]`）を返す

```javascript
function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem('nisa-dip-history') || '[]');
  } catch(e) {
    return [];
  }
}
```

## Canvas描画エラー

- `canvas` 要素が存在しない場合は即リターンする
- サイズが取得できない場合はデフォルト値（320px）を使用する

```javascript
function drawDipChart(canvasEl, fixedW) {
  const canvas = canvasEl || document.getElementById('dip-chart');
  if (!canvas) return; // 必須
  const W = fixedW || canvas.offsetWidth || 320; // デフォルト値
}
```

## 通知エラー

- ブラウザ通知が非対応の場合はサイレントにスキップする（エラー表示しない）
- 通知許可が拒否された場合はトーストで1度だけ通知し、以降は催促しない

## コードレビューチェックリスト

- [ ] 外部API呼び出しは `try/catch` で囲まれているか
- [ ] `JSON.parse` は `try/catch` で囲まれているか
- [ ] ユーザー入力エラーは日本語で明示されているか
- [ ] NISA枠超過時に処理がブロックされているか
- [ ] `canvas` のnullチェックが実装されているか
