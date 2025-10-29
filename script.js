const API_BASE = "https://amadeus-proxy.nikhilcloudonline.workers.dev/api/search";

document.getElementById("searchForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const origin = document.getElementById("origin").value.trim().toUpperCase();
  const destination = document.getElementById("destination").value.trim().toUpperCase();
  const rawDate = document.getElementById("date").value.trim();
  const adults = document.getElementById("adults").value.trim() || "1";

  // Convert 31/10/2025 or 2025-10-31 -> 2025-10-31
  const date = normalizeDate(rawDate);

  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = `<p>Loading...</p>`;

  // Build URL safely
  const url = `${API_BASE}?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(
    destination
  )}&date=${encodeURIComponent(date)}&adults=${encodeURIComponent(adults)}&currencyCode=EUR&max=10`;

  try {
    const res = await fetch(url, { method: "GET" });

    // If backend returns 4xx/5xx, show the body to help debug
    if (!res.ok) {
      const text = await res.text();
      resultsDiv.innerHTML = `<p style="color:#d33">Error ${res.status}: ${escapeHtml(text)}</p>`;
      return;
    }

    const data = await res.json();
    renderResults(data);
  } catch (err) {
    resultsDiv.innerHTML = `<p style="color:#d33">Network error: ${escapeHtml(String(err))}</p>`;
  }
});

/** Convert '31/10/2025' or '31-10-2025' or '2025-10-31' to '2025-10-31' */
function normalizeDate(s) {
  if (!s) return "";
  // Already ISO?
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // DD/MM/YYYY or DD-MM-YYYY
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) {
    const d = m[1].padStart(2, "0");
    const mo = m[2].padStart(2, "0");
    const y = m[3];
    return `${y}-${mo}-${d}`;
  }
  // Last fallback: let Date parse and reformat
  const dt = new Date(s);
  if (!isNaN(dt)) {
    const yyyy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    const dd = String(dt.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }
  return s; // give backend what we have (will error visibly)
}

function renderResults(payload) {
  const resultsDiv = document.getElementById("results");
  const offers = payload?.data || [];
  if (!offers.length) {
    resultsDiv.innerHTML = `<p>No results.</p>`;
    return;
  }

  // Minimal cards
  const cards = offers.map((o) => {
    const price = o.price?.grandTotal + " " + (o.price?.currency || "");
    const itin = o.itineraries?.[0];
    const segs = itin?.segments || [];
    const first = segs[0];
    const last = segs[segs.length - 1];
    const route = `${first?.departure?.iataCode} → ${last?.arrival?.iataCode}`;
    const dep = first?.departure?.at?.replace("T", " ").slice(0, 16) || "";
    const arr = last?.arrival?.at?.replace("T", " ").slice(0, 16) || "";
    const duration = itin?.duration?.replace(/^P|T|M|H/g, (x) => ({P:"",T:" ",H:"h ",M:"m"}[x])) || "";

    return `
      <div class="card">
        <div class="card-row">
          <strong>${route}</strong>
          <span>${escapeHtml(price)}</span>
        </div>
        <div class="card-row small">
          <span>Depart: ${escapeHtml(dep)}</span>
          <span>Arrive: ${escapeHtml(arr)}</span>
          <span>Duration: ${escapeHtml(duration)}</span>
        </div>
        <div class="card-row tiny">
          ${segs.map(s => `${s.carrierCode}${s.number} (${s.departure.iataCode}→${s.arrival.iataCode})`).join(" • ")}
        </div>
      </div>`;
  });

  resultsDiv.innerHTML = cards.join("");
}

// Simple HTML escaper for error text
function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
