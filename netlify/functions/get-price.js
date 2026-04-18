exports.handler = async () => {
  try {
    const res = await fetch(
      "https://query1.finance.yahoo.com/v8/finance/chart/0331418A.T?interval=1d&range=1d",
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Accept": "application/json",
        }
      }
    );
    const data = await res.json();
    const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;

    if (!price) throw new Error("価格未検出: " + JSON.stringify(data).slice(0, 200));

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ price: Math.round(price) }),
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: e.message }),
    };
  }
};
