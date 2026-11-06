const { parseQuote } = require("../lib/parse");
const { comparePublic } = require("../lib/publicPrice");

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const text = body && body.text;
  if (!text || String(text).trim().length < 10) {
    return res.status(400).json({ error: "Paste a quote, cart, or receipt text (min 10 chars)." });
  }

  const parsed = parseQuote(text);
  const comparison = await comparePublic(parsed.domain, parsed.total);

  // Minimal ephemeral response — we do not persist pastes on the server in this MVP
  res.status(200).json({
    disclaimer:
      "Automated estimate only. Not financial, legal, or shopping advice. Public homepage price samples are incomplete and may not match the exact SKU. No reliance. We do not store your paste on the server in this MVP.",
    parsed,
    comparison,
    operator: {
      name: "Nathan Petty",
      email: "nathan@nathanpetty.com",
      address: "791 Jensen Court, Encinitas, CA 92024",
    },
  });
};
