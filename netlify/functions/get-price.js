exports.handler = async () => {
  try {
    const res = await fetch(
      "https://script.google.com/macros/s/AKfycbxpqamvYslmIhrsoPODq6kW-wfBf74A1nSfO3r9ESL_Gu0Ja7S8dFDL-vFl_2w_JlrX/exec"
    );
    const data = await res.json();
    const price = data?.price;

    if (!price) throw new Error("価格未検出");

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
