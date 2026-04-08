const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  // Check admin password
  const auth = event.headers.authorization || "";
  const token = auth.replace("Bearer ", "");
  if (token !== process.env.ADMIN_PASSWORD) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: "Unauthorized" }) };
  }

  try {
    const store = getStore("bookings");
    const { blobs } = await store.list();

    const bookings = [];
    for (const blob of blobs) {
      const data = await store.get(blob.key, { type: "json" });
      if (data) bookings.push(data);
    }

    // Sort newest first
    bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return { statusCode: 200, headers, body: JSON.stringify(bookings) };
  } catch (err) {
    console.error("Get bookings error:", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Failed to load bookings" }) };
  }
};
