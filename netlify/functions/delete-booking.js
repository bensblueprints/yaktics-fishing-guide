const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  const auth = event.headers.authorization || "";
  const token = auth.replace("Bearer ", "");
  if (token !== process.env.ADMIN_PASSWORD) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: "Unauthorized" }) };
  }

  try {
    const { id } = JSON.parse(event.body);
    if (!id) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing booking id" }) };
    }

    const store = getStore("bookings");
    await store.delete(id);

    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error("Delete booking error:", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Failed to delete booking" }) };
  }
};
