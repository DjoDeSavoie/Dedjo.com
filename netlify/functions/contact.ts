export const handler = async (event: any) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  try {
    const { name, email, category, message, source } = JSON.parse(event.body || "{}");

    // validations simples (côté serveur)
    if (!name || typeof name !== "string" || name.trim().length > 100) {
      return { statusCode: 400, body: JSON.stringify({ error: "Nom invalide" }) };
    }
    if (!email || typeof email !== "string" || !email.includes("@") || email.length > 255) {
      return { statusCode: 400, body: JSON.stringify({ error: "Email invalide" }) };
    }
    if (!category || typeof category !== "string") {
      return { statusCode: 400, body: JSON.stringify({ error: "Catégorie invalide" }) };
    }
    if (!message || typeof message !== "string" || message.trim().length > 1000) {
      return { statusCode: 400, body: JSON.stringify({ error: "Message invalide" }) };
    }

    const webhookUrl = process.env.GSHEET_CONTACT_WEBHOOK_URL;
    if (!webhookUrl) {
      return { statusCode: 500, body: JSON.stringify({ error: "Missing env var GSHEET_CONTACT_WEBHOOK_URL" }) };
    }

    const payload = {
      date: new Date().toISOString(),
      name: name.trim(),
      email: email.trim(),
      category,
      message: message.trim(),
      source: typeof source === "string" ? source : "site",
    };

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    if (!res.ok) {
      return {
        statusCode: res.status,
        body: JSON.stringify({ error: "Google Sheet webhook error", details: text }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true }),
    };
  } catch (e: any) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};