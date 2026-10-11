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
      console.error("Variable d'environnement manquante : GSHEET_CONTACT_WEBHOOK_URL");
      return { statusCode: 500, body: JSON.stringify({ error: "Le formulaire de contact n'est pas encore disponible." }) };
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

    // Détails de l'erreur dans les journaux Netlify uniquement (jamais renvoyés au navigateur)
    const text = await res.text();
    if (!res.ok) {
      console.error("Erreur du webhook de contact", res.status, text.slice(0, 200));
      return {
        statusCode: 502,
        body: JSON.stringify({ error: "Ton message n'a pas pu être envoyé. Réessaie dans un instant." }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true }),
    };
  } catch (e: any) {
    console.error("Erreur d'envoi du formulaire de contact", e?.name, e?.message);
    return { statusCode: 500, body: JSON.stringify({ error: "Ton message n'a pas pu être envoyé. Réessaie dans un instant." }) };
  }
};