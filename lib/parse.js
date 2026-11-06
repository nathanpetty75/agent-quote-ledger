/** Extract merchant, amounts, items from pasted agent quote/receipt text. No cards. */
function parseQuote(text) {
  const raw = String(text || "").slice(0, 20000);
  const amounts = [...raw.matchAll(/(?:USD|US\$|\$)\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?|[0-9]+\.[0-9]{2})/gi)]
    .map((m) => Number(m[1].replace(/,/g, "")))
    .filter((n) => n > 0 && n < 1e7);
  const totalHints = [...raw.matchAll(/(?:total|you\s+pay|grand\s+total|amount\s+due|order\s+total)[^\d$]{0,20}(?:USD|US\$|\$)?\s*([0-9,.]+)/gi)]
    .map((m) => Number(m[1].replace(/,/g, "")))
    .filter((n) => n > 0);
  const total = totalHints.length ? totalHints[totalHints.length - 1] : amounts.length ? Math.max(...amounts) : null;

  let merchant = null;
  const merch = raw.match(/(?:from|seller|merchant|sold\s+by|store|vendor)\s*[:\-]?\s*([A-Za-z0-9][A-Za-z0-9 .&'\-]{1,60})/i);
  if (merch) merchant = merch[1].trim();
  const domain = raw.match(/\b([a-z0-9][a-z0-9\-.]{1,60}\.(?:com|net|org|co|io|shop|store))\b/i);
  const domainHost = domain ? domain[1].toLowerCase() : null;

  let agent = "unknown";
  const lower = raw.toLowerCase();
  if (/chatgpt|openai/.test(lower)) agent = "ChatGPT";
  else if (/\bgrok\b|x\.ai/.test(lower)) agent = "Grok";
  else if (/perplexity|comet/.test(lower)) agent = "Perplexity";
  else if (/gemini|google\s+ai/.test(lower)) agent = "Gemini";
  else if (/claude|anthropic/.test(lower)) agent = "Claude";
  else if (/rufus|amazon/.test(lower)) agent = "Amazon";
  else if (/copilot|bing/.test(lower)) agent = "Copilot";

  const itemLines = raw
    .split(/\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 3 && l.length < 120 && /[A-Za-z]/.test(l) && !/^(total|subtotal|tax|shipping|from|to|hi|hello)/i.test(l))
    .slice(0, 8);

  return { agent, merchant, domain: domainHost, total, amounts: amounts.slice(0, 20), item_guesses: itemLines, char_count: raw.length };
}

module.exports = { parseQuote };
