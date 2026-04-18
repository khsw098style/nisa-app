exports.handler = async () => {
  try {
    const res = await fetch(
      "https://api.am.mufg.jp/fund/dividend/253425"
    );
    const data = await res.json();
    const price = data?.base_price;
    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ price }),
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "取得失敗" }),
    };
  }
};
