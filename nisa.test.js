/**
 * NISA運用ダッシュボード ユニットテスト
 * 実行方法: node tests/nisa.test.js
 */

'use strict';

// ════════════════════════════════════════
// テストフレームワーク（外部ライブラリ不要）
// ════════════════════════════════════════

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (e) {
    console.log(`  ❌ ${name}`);
    console.log(`     → ${e.message}`);
    failed++;
  }
}

function describe(suiteName, fn) {
  console.log(`\n📋 ${suiteName}`);
  fn();
}

function expect(actual) {
  return {
    toBe(expected) {
      if (actual !== expected)
        throw new Error(`期待値: ${expected}　実際: ${actual}`);
    },
    toEqual(expected) {
      const a = JSON.stringify(actual), b = JSON.stringify(expected);
      if (a !== b) throw new Error(`期待値: ${b}　実際: ${a}`);
    },
    toBeGreaterThan(n) {
      if (!(actual > n)) throw new Error(`${actual} > ${n} が成立しない`);
    },
    toBeLessThanOrEqual(n) {
      if (!(actual <= n)) throw new Error(`${actual} <= ${n} が成立しない`);
    },
    toBeCloseTo(expected, precision = 0) {
      const diff = Math.abs(actual - expected);
      const threshold = Math.pow(10, -precision) / 2;
      if (diff > threshold)
        throw new Error(`期待値: ≈${expected}　実際: ${actual}　差: ${diff}`);
    },
    toBeTruthy() {
      if (!actual) throw new Error(`${actual} はtruthyではない`);
    },
    toBeFalsy() {
      if (actual) throw new Error(`${actual} はfalsyではない`);
    },
  };
}

// ════════════════════════════════════════
// テスト対象関数（index.htmlから抽出）
// ════════════════════════════════════════

/** アプリ定数 */
const NISA = Object.freeze({
  LIFETIME_LIMIT:  18_000_000,
  TSUMITATE_LIMIT:  1_200_000,
  GROWTH_LIMIT:     2_400_000,
});

const DIP_CONFIG = Object.freeze({
  HIGH_PRICE_BUFFER: 1.02,
  LEVELS: [
    { label: '-10%ライン', pct: 0.10, flagKey: 'flag_10', amount: 100_000 },
    { label: '-20%ライン', pct: 0.20, flagKey: 'flag_20', amount: 200_000 },
    { label: '-30%ライン', pct: 0.30, flagKey: 'flag_30', amount: 500_000 },
    { label: '-40%以上',  pct: 0.40, flagKey: null,       amount: 0 },
  ],
});

/**
 * 複利計算エンジン（calcDipSeriesの純粋関数版）
 * @param {number} rate - 年利（%）
 * @param {number} years - 運用年数
 * @param {number[]} yearlyDeposits - 各年の入金額配列
 * @param {number} extraFirst - 1年目の追加入金額
 * @returns {{ noDip: number[], withDip: number[] }}
 */
function calcCompoundInterest(rate, years, yearlyDeposits, extraFirst = 0) {
  const r = rate / 100;
  const noDip = [], withDip = [];
  let balNo = 0, balWith = 0;

  for (let i = 0; i < years; i++) {
    const deposit = yearlyDeposits[i] || 0;
    const extra = i === 0 ? extraFirst : 0;
    balNo   = (balNo   + deposit)         * (1 + r);
    balWith = (balWith + deposit + extra) * (1 + r);
    noDip.push(Math.round(balNo));
    withDip.push(Math.round(balWith));
  }
  return { noDip, withDip };
}

/**
 * 下落率計算
 * @param {number} currentPrice - 現在価格
 * @param {number} highPrice - 高値基準価格
 * @returns {number} 下落率（小数。-0.1 = -10%）
 */
function calcDipRate(currentPrice, highPrice) {
  if (highPrice <= 0) return 0;
  return (currentPrice - highPrice) / highPrice;
}

/**
 * 到達した下落ラインを判定（最も深刻なもの）
 * pct降順（-40%→-10%）でソートして最初にマッチしたものを返す
 * @param {number} dipRate - 下落率（小数）
 * @returns {object|null} 到達したレベル
 */
function getHitLevel(dipRate) {
  const sorted = [...DIP_CONFIG.LEVELS].sort((a, b) => b.pct - a.pct);
  for (const level of sorted) {
    if (level.flagKey && dipRate <= -level.pct) return level;
  }
  return null;
}

/**
 * NISA年間成長枠チェック
 * @param {number} currentYearGrowth - 今年の成長枠使用済み額
 * @param {number} newAmount - 追加入金額
 * @returns {{ ok: boolean, remain: number }}
 */
function checkGrowthLimit(currentYearGrowth, newAmount) {
  const remain = NISA.GROWTH_LIMIT - currentYearGrowth;
  return { ok: currentYearGrowth + newAmount <= NISA.GROWTH_LIMIT, remain };
}

/**
 * NISA生涯投資枠チェック
 * @param {number} lifetimeUsed - 生涯使用済み額
 * @param {number} newAmount - 追加入金額
 * @returns {{ ok: boolean, remain: number }}
 */
function checkLifetimeLimit(lifetimeUsed, newAmount) {
  const remain = NISA.LIFETIME_LIMIT - lifetimeUsed;
  return { ok: lifetimeUsed + newAmount <= NISA.LIFETIME_LIMIT, remain };
}

/**
 * 新高値判定（2%バッファ付き）
 * @param {number} currentPrice - 現在価格
 * @param {number} highPrice - 高値基準価格
 * @returns {boolean}
 */
function isNewHigh(currentPrice, highPrice) {
  return currentPrice > highPrice * DIP_CONFIG.HIGH_PRICE_BUFFER;
}

// ════════════════════════════════════════
// テストスイート
// ════════════════════════════════════════

describe('NISA枠チェック', () => {
  describe('年間成長投資枠（上限240万円）', () => {
    test('使用済み0円 + 10万円 → OK', () => {
      const result = checkGrowthLimit(0, 100_000);
      expect(result.ok).toBe(true);
      expect(result.remain).toBe(2_400_000);
    });

    test('使用済み230万円 + 10万円 = ちょうど240万 → OK', () => {
      const result = checkGrowthLimit(2_300_000, 100_000);
      expect(result.ok).toBe(true);
      expect(result.remain).toBe(100_000);
    });

    test('使用済み230万円 + 11万円 = 241万 → NG', () => {
      const result = checkGrowthLimit(2_300_000, 110_000);
      expect(result.ok).toBe(false);
    });

    test('使用済み240万円 + 1円 → NG', () => {
      const result = checkGrowthLimit(2_400_000, 1);
      expect(result.ok).toBe(false);
      expect(result.remain).toBe(0);
    });
  });

  describe('生涯投資枠（上限1800万円）', () => {
    test('使用済み0円 + 360万円 → OK', () => {
      const result = checkLifetimeLimit(0, 3_600_000);
      expect(result.ok).toBe(true);
    });

    test('使用済み1799万円 + 1万円 = ちょうど1800万 → OK', () => {
      const result = checkLifetimeLimit(17_990_000, 10_000);
      expect(result.ok).toBe(true);
    });

    test('使用済み1799万円 + 2万円 = 1801万 → NG', () => {
      const result = checkLifetimeLimit(17_990_000, 20_000);
      expect(result.ok).toBe(false);
    });

    test('生涯枠満額時の残り枠は0円', () => {
      const result = checkLifetimeLimit(18_000_000, 0);
      expect(result.remain).toBe(0);
    });
  });
});

describe('下落率計算', () => {
  test('35,500円 → 31,950円 = ちょうど-10%', () => {
    const rate = calcDipRate(31_950, 35_500);
    expect(rate).toBeCloseTo(-0.1, 2);
  });

  test('35,500円 → 35,500円 = 0%（変動なし）', () => {
    const rate = calcDipRate(35_500, 35_500);
    expect(rate).toBe(0);
  });

  test('35,500円 → 37,000円 = 上昇（プラス）', () => {
    const rate = calcDipRate(37_000, 35_500);
    expect(rate).toBeGreaterThan(0);
  });

  test('高値が0の場合は0を返す（ゼロ除算ガード）', () => {
    const rate = calcDipRate(35_500, 0);
    expect(rate).toBe(0);
  });
});

describe('下落ライン到達判定', () => {
  test('-5% → 到達なし（null）', () => {
    const result = getHitLevel(-0.05);
    expect(result).toBe(null);
  });

  test('-10% → -10%ラインに到達', () => {
    const result = getHitLevel(-0.10);
    expect(result.label).toBe('-10%ライン');
    expect(result.amount).toBe(100_000);
  });

  test('-15% → -10%ライン（最初に到達したライン）', () => {
    const result = getHitLevel(-0.15);
    expect(result.label).toBe('-10%ライン');
  });

  test('-20% → -20%ライン', () => {
    const result = getHitLevel(-0.20);
    expect(result.label).toBe('-20%ライン');
    expect(result.amount).toBe(200_000);
  });

  test('-30% → -30%ライン', () => {
    const result = getHitLevel(-0.30);
    expect(result.label).toBe('-30%ライン');
    expect(result.amount).toBe(500_000);
  });

  test('-40% → flagKeyがnullの-40%以上ラインはスキップされ-30%ラインを返す', () => {
    // -40%以上はflagKey=nullのためスキップ → 最深のflagKey付きは-30%
    const result = getHitLevel(-0.40);
    expect(result.label).toBe('-30%ライン');
  });
});

describe('新高値判定（2%バッファ）', () => {
  // 35,500 × 1.02 = 36,210
  test('高値35,500円 → 36,211円（2%超）で新高値', () => {
    expect(isNewHigh(36_211, 35_500)).toBe(true);
  });

  test('高値35,500円 → 36,210円（ちょうど2%）はバッファ内でNG', () => {
    expect(isNewHigh(36_210, 35_500)).toBe(false);
  });

  test('高値35,500円 → 36,000円（1.4%）はバッファ内でNG', () => {
    expect(isNewHigh(36_000, 35_500)).toBe(false);
  });

  test('高値35,500円 → 35,500円（同値）はNG', () => {
    expect(isNewHigh(35_500, 35_500)).toBe(false);
  });

  test('現在価格が高値より低い場合はNG', () => {
    expect(isNewHigh(30_000, 35_500)).toBe(false);
  });
});

describe('複利計算エンジン', () => {
  test('年利0%・1年・100万入金 → 残高100万（利子なし）', () => {
    const { noDip } = calcCompoundInterest(0, 1, [1_000_000]);
    expect(noDip[0]).toBe(1_000_000);
  });

  test('年利10%・1年・100万入金 → 残高110万', () => {
    const { noDip } = calcCompoundInterest(10, 1, [1_000_000]);
    expect(noDip[0]).toBe(1_100_000);
  });

  test('追加投資あり版は積立のみより残高が多い', () => {
    const deposits = [600_000, 600_000, 600_000];
    const { noDip, withDip } = calcCompoundInterest(5, 3, deposits, 300_000);
    expect(withDip[2]).toBeGreaterThan(noDip[2]);
  });

  test('複利効果で20年後は10年後の2倍以上', () => {
    const deposits = Array(20).fill(600_000);
    const { noDip } = calcCompoundInterest(5, 20, deposits);
    expect(noDip[19]).toBeGreaterThan(noDip[9] * 2);
  });

  test('年数が増えるほど残高が増える', () => {
    const deposits = Array(5).fill(600_000);
    const { noDip } = calcCompoundInterest(5, 5, deposits);
    for (let i = 1; i < 5; i++) {
      expect(noDip[i]).toBeGreaterThan(noDip[i - 1]);
    }
  });
});

// ════════════════════════════════════════
// CSVパース関連テスト（Node.js用モック）
// ════════════════════════════════════════

/**
 * parseRakutenCSVのNode.js版（TextDecoderは別途渡す）
 * @param {string} text - デコード済みCSVテキスト
 * @returns {object|null}
 */
function parseRakutenCSVText(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const ORUKAN_NAME    = 'eMAXIS Slim';
  const TSUMITATE_LABEL = 'つみたて投資枠';
  const GROWTH_LABEL   = '成長投資枠';

  function parseLine(line) {
    const cols = [];
    let cur = '', inQ = false;
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; continue; }
      if (ch === ',' && !inQ) { cols.push(cur.trim()); cur = ''; continue; }
      cur += ch;
    }
    cols.push(cur.trim());
    return cols;
  }

  function toNum(str) { return parseFloat((str || '').replace(/,/g, '')) || 0; }

  let tsumitate = null, growth = null;
  for (const line of lines) {
    if (!line.includes(ORUKAN_NAME)) continue;
    const cols = parseLine(line);
    if (cols.length < 17) continue;
    const account  = cols[3];
    const units    = toNum(cols[4]);
    const avgPrice = toNum(cols[6]);
    const curPrice = toNum(cols[8]);
    const evalAmt  = toNum(cols[14]);
    const gainAmt  = toNum(cols[16]);
    const gainPct  = toNum(cols[17]);
    const row = { units, avgPrice, curPrice, evalAmt, gainAmt, gainPct };
    if (account.includes(TSUMITATE_LABEL))      tsumitate = row;
    else if (account.includes(GROWTH_LABEL))    growth    = row;
  }
  if (!tsumitate && !growth) return null;
  return {
    tsumitate: tsumitate || { units:0, avgPrice:0, curPrice:0, evalAmt:0, gainAmt:0, gainPct:0 },
    growth:    growth    || { units:0, avgPrice:0, curPrice:0, evalAmt:0, gainAmt:0, gainPct:0 },
    importedAt: '2026/05/10',
  };
}

/** テスト用CSVデータ生成 */
function makeCSVRow(account, units, avgPrice, curPrice, evalAmt, gainAmt, gainPct) {
  return `"投資信託","","eMAXIS Slim 全世界株式(オール・カントリー)","${account}","${units}","口","${avgPrice}","円","${curPrice}","円","","","+27","円","${evalAmt}","-","${gainAmt}","${gainPct}"`;
}

describe('楽天証券CSVパース', () => {
  test('つみたて投資枠のデータを正しく取得できる', () => {
    const csv = makeCSVRow('NISAつみたて投資枠', '17,614', '34,063.81', '36,326', '63,985', '+3,985', '+6.64');
    const result = parseRakutenCSVText(csv);
    expect(result).toBeTruthy();
    expect(result.tsumitate.units).toBe(17614);
    expect(result.tsumitate.evalAmt).toBe(63985);
    expect(result.tsumitate.gainAmt).toBe(3985);
  });

  test('成長投資枠のデータを正しく取得できる', () => {
    const csv = makeCSVRow('NISA成長投資枠', '108,222', '33,264.96', '36,326', '393,127', '+33,127', '+9.20');
    const result = parseRakutenCSVText(csv);
    expect(result).toBeTruthy();
    expect(result.growth.units).toBe(108222);
    expect(result.growth.evalAmt).toBe(393127);
  });

  test('つみたて・成長の両枠が含まれる場合、両方取得できる', () => {
    const row1 = makeCSVRow('NISAつみたて投資枠', '17,614', '34,063.81', '36,326', '63,985', '+3,985', '+6.64');
    const row2 = makeCSVRow('NISA成長投資枠', '108,222', '33,264.96', '36,326', '393,127', '+33,127', '+9.20');
    const result = parseRakutenCSVText(row1 + '\n' + row2);
    expect(result.tsumitate.units).toBe(17614);
    expect(result.growth.units).toBe(108222);
  });

  test('オルカンのデータがない場合はnullを返す', () => {
    const csv = '"投資信託","","別のファンド","NISAつみたて投資枠","1,000","口","10,000","円","11,000","円","","","0","円","11,000","-","1,000","10.00"';
    const result = parseRakutenCSVText(csv);
    expect(result).toBe(null);
  });

  test('空のCSVはnullを返す', () => {
    const result = parseRakutenCSVText('');
    expect(result).toBe(null);
  });

  test('口数は数値として取得される（カンマ除去）', () => {
    const csv = makeCSVRow('NISAつみたて投資枠', '17,614', '34,063.81', '36,326', '63,985', '+3,985', '+6.64');
    const result = parseRakutenCSVText(csv);
    expect(typeof result.tsumitate.units).toBe('number');
    expect(result.tsumitate.units).toBe(17614);
  });

  test('含み益がプラスの場合、gainAmtはプラス', () => {
    const csv = makeCSVRow('NISAつみたて投資枠', '17,614', '34,063.81', '36,326', '63,985', '+3,985', '+6.64');
    const result = parseRakutenCSVText(csv);
    expect(result.tsumitate.gainAmt).toBeGreaterThan(0);
  });
});

// ════════════════════════════════════════
// 結果サマリー
// ════════════════════════════════════════
console.log('\n' + '='.repeat(40));
console.log(`結果: ${passed + failed}件中 ✅${passed}件成功 / ❌${failed}件失敗`);
console.log('='.repeat(40));
process.exit(failed > 0 ? 1 : 0);
