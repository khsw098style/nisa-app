exports.handler = async () => {
  try {
    // 投資信託協会のCSVデータから取得
    const res = await fetch(
      "https://toushin-lib.fwg.ne.jp/FdsWeb/FDST030000?isinCd=JP90C000H1T1",
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "text/html,application/xhtml+xml",
          "Accept-Language": "ja,en;q=0.9",
        }
      }
    );
    const html = await res.text();

    // 基準価額を抽出
    const match = html.match(/([0-9]{2},?[0-9]{3})\s*円/);
    const price = match ? parseInt(match[1].replace(/,/g, "")) : null;

    if (!price) {
      const snippet = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 300);
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
