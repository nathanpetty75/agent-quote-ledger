/**
 * Compare against PUBLIC price pages only (polite GET).
 * No login, no cart manipulation. Best-effort; always disclaimer.
 */
const UA = "AgentQuoteLedgerBot/0.1 (+https://agent-quote-ledger.vercel.app; research; nathan@nathanpetty.com)";

async function fetchPublic(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 10000);
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: ctrl.signal,
      headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" },
    });
    const text = await res.text();
    return { status: res.status, text: text.slice(0, 400000), finalUrl: res.url };
  } catch (e) {
    return { status: 0, text: "", error: String(e.message || e) };
  } finally {
    clearTimeout(t);
  }
}

function extractPrices(html) {
  const prices = [...html.matchAll(/(?:\$|USD\s*)([0-9]{1,5}(?:\.[0-9]{2})?)/g)]
    .map((m) => Number(m[1]))
    .filter((n) => n >= 1 && n < 50000);
  // Prefer schema.org price
  const schema = [...html.matchAll(/"price"\s*:\s*"?([0-9]+(?:\.[0-9]+)?)"?/gi)].map((m) => Number(m[1]));
  const pool = schema.length ? schema : prices;
  if (!pool.length) return { min: null, median: null, samples: [] };
  pool.sort((a, b) => a - b);
  const mid = pool[Math.floor(pool.length / 2)];
  return { min: pool[0], median: mid, samples: pool.slice(0, 12) };
}

async function comparePublic(domain, total) {
  if (!domain || !total) return { status: "skipped", reason: "need domain and total from paste" };
  const url = `https://${domain.replace(/^www\./, "")}/`;
  const page = await fetchPublic(url);
  if (page.status !== 200) {
    return { status: "unavailable", http: page.status, error: page.error || null, checked_url: url };
  }
  const prices = extractPrices(page.text);
  if (prices.min == null) {
    return { status: "no_public_price_found", checked_url: page.finalUrl || url, note: "Homepage HTML had no clear price; paste a product URL domain next time if possible." };
  }
  const ref = prices.median ?? prices.min;
  const delta = total - ref;
  const pct = ref ? (delta / ref) * 100 : null;
  let flag = "similar";
  if (pct != null && pct > 15) flag = "possible_overpay";
  else if (pct != null && pct < -15) flag = "cheaper_than_page_sample";
  return {
    status: "compared",
    checked_url: page.finalUrl || url,
    reference_median: ref,
    reference_min: prices.min,
    quote_total: total,
    delta,
    pct_vs_reference: pct != null ? Math.round(pct * 10) / 10 : null,
    flag,
    sample_prices_seen: prices.samples,
  };
}

module.exports = { comparePublic, UA };
