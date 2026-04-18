exports.handler = async () => {
  try {
    const res = await fetch(
      "https://itf.minkabu.jp/fund/0331418A",
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml",
          "Accept-Language": "ja,en;q=0.9",
        }
      }
    );
    const html = await res.text();

    // 複数パターンで基準価額を探す
    const patterns = [
      /(\d{2,3},\d{3})<\/span>\s*円/,
      /"nav_price"\s*:\s*"?([0-9,]+)"?/,
      /基準価格[^\d]*(\d{2,3},\d{3})/,
      /(\d{2,3},\d{3})\s*円.*?基準/,
    ];

    let price = null;
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        price = parseInt(match[1].replace(/,/g, ""));
        break;
      }
    }

    // デバッグ用：HTMLの一部を返す
    if (!price) {
      const snippet = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 500);
      throw new Error("価格未検出: " + snippet);
    }

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
