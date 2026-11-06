const out = document.getElementById("out");
document.getElementById("go").addEventListener("click", async () => {
  const text = document.getElementById("paste").value;
  out.innerHTML = "<p class='muted'>Checking…</p>";
  try {
    const r = await fetch("/api/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const j = await r.json();
    if (!r.ok) { out.innerHTML = `<p>${j.error || "Error"}</p>`; return; }
    const c = j.comparison || {};
    const p = j.parsed || {};
    out.innerHTML = `
      <div class="card">
        <p class="muted">${j.disclaimer}</p>
        <p><b>Detected agent:</b> ${p.agent || "—"} · <b>Merchant guess:</b> ${p.merchant || "—"} · <b>Domain:</b> ${p.domain || "—"}</p>
        <p><b>Quote total parsed:</b> ${p.total != null ? "$" + p.total : "not found"}</p>
        <p><b>Public check:</b> ${c.status}${c.checked_url ? ` · <a href="${c.checked_url}" rel="noopener noreferrer">${c.checked_url}</a>` : ""}</p>
        ${c.flag ? `<p class="flag-${c.flag}">Flag: ${c.flag.replace(/_/g," ")} (Δ ${c.delta != null ? "$"+Math.round(c.delta*100)/100 : "—"}, ${c.pct_vs_reference ?? "—"}% vs page sample median $${c.reference_median ?? "—"})</p>` : ""}
        ${c.note ? `<p class="muted">${c.note}</p>` : ""}
        ${c.error ? `<p class="muted">Fetch note: ${c.error}</p>` : ""}
      </div>`;
  } catch (e) {
    out.innerHTML = `<p>Network error: ${e.message}</p>`;
  }
});
