export default async (request) => {
  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { "content-type": "application/json" }
      }
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: "GEMINI_API_KEY is not configured in Netlify."
      }),
      {
        status: 500,
        headers: { "content-type": "application/json" }
      }
    );
  }

  let body;

  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON." }),
      {
        status: 400,
        headers: { "content-type": "application/json" }
      }
    );
  }

  const question = String(
    body?.message ?? body?.question ?? ""
  ).trim();

  if (!question) {
    return new Response(
      JSON.stringify({ error: "Please enter a question." }),
      {
        status: 400,
        headers: { "content-type": "application/json" }
      }
    );
  }

  const prompt = `
You are the educational AI Tutor for MASTER TRADING+AI.

Teach trading concepts clearly and responsibly.

Do not guarantee profits or claim that a trade will definitely win.

Explain risk management and distinguish education from financial advice.

User question:
${question}
`;

  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
      encodeURIComponent(apiKey),
    {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ]
      })
    }
  );

  const data = await response.json();

  if (!response.ok) {
    return new Response(
      JSON.stringify({
        error:
          data?.error?.message ||
          "Gemini request failed."
      }),
      {
        status: response.status,
        headers: { "content-type": "application/json" }
      }
    );
  }

  const reply =
    data?.candidates?.[0]?.content?.parts
      ?.map((p) => p.text || "")
      .join("") ||
    "No response was returned.";

  return new Response(
    JSON.stringify({ reply }),
    {
      status: 200,
      headers: { "content-type": "application/json" }
    }
  );
};
