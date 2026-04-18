exports.handler = async () => {
  try {
    const res = await fetch(
      "https://itf.minkabu.jp/fund/0331418A/daily_price",
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "application/json, text/plain, */*",
          "Referer": "https://itf.minkabu.jp/fund/0331418A"
        }
      }
    );
    const text = await res.text();

    // 数字を含むJSONまたはテキストから価格を抽出
    const match = text.match(/"close"\s*:\s*([0-9.]+)/);
    const price = match ? Math.round(parseFloat(match[1])) : null;

    if (!price) throw new Error("パース失敗: " + text.slice(0, 200));

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ price }),
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: e.message }),
    };
  }
};
