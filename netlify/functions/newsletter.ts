export const handler = async (event: any) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  try {
    const { email } = JSON.parse(event.body || "{}");

    if (!email || typeof email !== "string") {
      return { statusCode: 400, body: JSON.stringify({ error: "Email requis" }) };
    }

    const apiKey = process.env.BREVO_API_KEY;
    const listId = Number(process.env.BREVO_LIST_ID);

    if (!apiKey || !listId) {
      console.error("Variables d'environnement manquantes : BREVO_API_KEY et/ou BREVO_LIST_ID");
      return { statusCode: 500, body: JSON.stringify({ error: "L'inscription n'est pas encore disponible." }) };
    }

    const res = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        email,
        listIds: [listId],
        updateEnabled: true,
      }),
    });

    // Détails de l'erreur dans les journaux Netlify uniquement (code Brevo, sans l'adresse)
    if (!res.ok) {
      const text = await res.text();
      let code = "";
      try {
        code = JSON.parse(text)?.code ?? "";
      } catch {
        // réponse non JSON
      }
      console.error("Erreur Brevo", res.status, code);
      return {
        statusCode: 502,
        body: JSON.stringify({ error: "L'inscription n'a pas pu aboutir. Vérifie ton adresse e-mail et réessaie." }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true }),
    };
  } catch (e: any) {
    console.error("Erreur d'inscription à la newsletter", e?.name, e?.message);
    return { statusCode: 500, body: JSON.stringify({ error: "L'inscription n'a pas pu aboutir. Réessaie dans un instant." }) };
  }
};