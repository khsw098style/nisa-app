exports.handler = async () => {
  try {
    const res = await fetch(
      "https://itf.minkabu.jp/fund/0331418A",
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Accept": "text/html"
        }
      }
    );
    const html = await res.text();
    const match = html.match(/基準価額[^0-9]*([0-9,]+)円/);
    const price = match ? parseInt(match[1].replace(/,/g, "")) : null;

    if (!price) throw new Error("取得失敗");

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
