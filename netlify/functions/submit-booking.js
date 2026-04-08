const { Resend } = require("resend");
const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  try {
    const data = JSON.parse(event.body);
    const { name, email, phone, tripType, date, guests, message } = data;

    if (!name || !email || !phone || !tripType || !date) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing required fields" }) };
    }

    // Store booking
    const store = getStore("bookings");
    const id = `booking-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const booking = {
      id,
      name,
      email,
      phone,
      tripType,
      date,
      guests: guests || "1",
      message: message || "",
      status: "new",
      createdAt: new Date().toISOString(),
    };
    await store.setJSON(id, booking);

    // Send emails via Resend
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      const resend = new Resend(resendKey);
      const fromEmail = process.env.FROM_EMAIL || "bookings@yaktics.com";

      // Email to Captain Reno
      await resend.emails.send({
        from: `Yaktics Bookings <${fromEmail}>`,
        to: ["reno@yaktics.com"],
        subject: `New Booking Request — ${tripType} on ${date}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0e17; color: #f1f5f9; padding: 32px; border-radius: 12px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #00d9d9; margin: 0; font-size: 24px;">New Booking Request</h1>
            </div>
            <div style="background: #111827; border-radius: 8px; padding: 24px; margin-bottom: 16px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0; color: #94a3b8; width: 120px;">Name</td><td style="padding: 8px 0; font-weight: 600;">${name}</td></tr>
                <tr><td style="padding: 8px 0; color: #94a3b8;">Email</td><td style="padding: 8px 0;"><a href="mailto:${email}" style="color: #00d9d9;">${email}</a></td></tr>
                <tr><td style="padding: 8px 0; color: #94a3b8;">Phone</td><td style="padding: 8px 0;"><a href="tel:${phone}" style="color: #00d9d9;">${phone}</a></td></tr>
                <tr><td style="padding: 8px 0; color: #94a3b8;">Trip</td><td style="padding: 8px 0; font-weight: 600; color: #00d9d9;">${tripType}</td></tr>
                <tr><td style="padding: 8px 0; color: #94a3b8;">Date</td><td style="padding: 8px 0;">${date}</td></tr>
                <tr><td style="padding: 8px 0; color: #94a3b8;">Guests</td><td style="padding: 8px 0;">${guests || "1"}</td></tr>
                ${message ? `<tr><td style="padding: 8px 0; color: #94a3b8; vertical-align: top;">Message</td><td style="padding: 8px 0;">${message}</td></tr>` : ""}
              </table>
            </div>
            <div style="text-align: center; color: #64748b; font-size: 12px; margin-top: 24px;">
              Yaktics LLC — Guided Kayak Fishing on the Gulf Coast
            </div>
          </div>
        `,
      });

      // Confirmation email to customer
      await resend.emails.send({
        from: `Yaktics LLC <${fromEmail}>`,
        to: [email],
        subject: `Booking Request Received — Yaktics LLC`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0e17; color: #f1f5f9; padding: 32px; border-radius: 12px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #00d9d9; margin: 0; font-size: 24px;">Thanks for Booking, ${name}!</h1>
              <p style="color: #94a3b8; margin-top: 8px;">We've received your request and will be in touch soon.</p>
            </div>
            <div style="background: #111827; border-radius: 8px; padding: 24px; margin-bottom: 16px;">
              <h3 style="color: #00d9d9; margin: 0 0 16px 0; font-size: 16px;">Your Booking Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0; color: #94a3b8; width: 120px;">Trip</td><td style="padding: 8px 0; font-weight: 600;">${tripType}</td></tr>
                <tr><td style="padding: 8px 0; color: #94a3b8;">Date</td><td style="padding: 8px 0;">${date}</td></tr>
                <tr><td style="padding: 8px 0; color: #94a3b8;">Guests</td><td style="padding: 8px 0;">${guests || "1"}</td></tr>
              </table>
            </div>
            <div style="background: #111827; border-radius: 8px; padding: 24px;">
              <p style="margin: 0 0 8px 0; color: #94a3b8;">Captain Reno will confirm your trip within 24 hours. Questions?</p>
              <p style="margin: 0;">
                <a href="tel:2512729834" style="color: #00d9d9; font-weight: 600;">(251) 272-9834</a> &nbsp;|&nbsp;
                <a href="mailto:reno@yaktics.com" style="color: #00d9d9;">reno@yaktics.com</a>
              </p>
            </div>
            <div style="text-align: center; color: #64748b; font-size: 12px; margin-top: 24px;">
              Yaktics LLC — Guided Kayak Fishing on the Gulf Coast
            </div>
          </div>
        `,
      });
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, id }),
    };
  } catch (err) {
    console.error("Booking error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Something went wrong. Please call us at (251) 272-9834." }),
    };
  }
};
