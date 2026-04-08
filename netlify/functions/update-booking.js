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
    const { id, status } = JSON.parse(event.body);
    if (!id || !status) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing id or status" }) };
    }

    const store = getStore("bookings");
    const booking = await store.get(id, { type: "json" });
    if (!booking) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: "Booking not found" }) };
    }

    booking.status = status;
    booking.updatedAt = new Date().toISOString();
    await store.setJSON(id, booking);

    return { statusCode: 200, headers, body: JSON.stringify({ success: true, booking }) };
  } catch (err) {
    console.error("Update booking error:", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Failed to update booking" }) };
  }
};
