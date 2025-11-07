// script.js — wire up form, call worker endpoints, render

// CHANGE THIS to your Worker URL (no trailing slash)
const API_BASE = "https://amadeus-proxy.nikhilcloudonline.workers.dev";
// === DOM ===
const originInput = document.getElementById("origin");
const destInput = document.getElementById("destination");
const depInput = document.getElementById("departureDate");
const searchBtn = document.getElementById("searchBtn");
const resultsDiv = document.getElementById("results");

// Autocomplete lists (<ul> in your HTML)
const originList = document.getElementById("origin-results");
const destList = document.getElementById("destination-results");

// === Helpers ===
function clearNode(el) { while (el.firstChild) el.removeChild(el.firstChild); }
function showError(msg) { resultsDiv.innerHTML = `<div class="error">${msg}</div>`; }
function createLi(text, code, targetInput, listEl) {
  const li = document.createElement("li");
  li.textContent = text;
  li.tabIndex = 0;
  li.className = "ac-item";
  li.addEventListener("click", () => {
    targetInput.value = code;
    clearNode(listEl);
  });
  return li;
}

let acTimer = null;
async function autocomplete(query, listEl) {
  clearNode(listEl);
  if (!query || query.length < 2) return;

  const u = new URL(API_BASE + "/api/locations");
  u.searchParams.set("keyword", query);

  try {
    const r = await fetch(u, { mode: "cors" });
    const j = await r.json();
    const rows = (j.data || []).map(x => {
      const code = x.iataCode || x.address?.cityCode || "";
      const name = x.name || x.detailedName || "";
      if (!code) return null;
      return { code, name };
    }).filter(Boolean);

    rows.forEach(it => {
      listEl.appendChild(createLi(`${it.code} — ${it.name}`, it.code, listEl === originList ? originInput : destInput, listEl));
    });
  } catch (e) { /* silent */ }
}

// Debounced handlers
function hookupAutocomplete(inputEl, listEl) {
  inputEl.addEventListener("input", () => {
    clearTimeout(acTimer);
    const q = inputEl.value.trim();
    acTimer = setTimeout(() => autocomplete(q, listEl), 250);
  });
  inputEl.addEventListener("blur", () => setTimeout(() => clearNode(listEl), 150));
}

hookupAutocomplete(originInput, originList);
hookupAutocomplete(destInput, destList);

// === Search ===
async function doSearch() {
  clearNode(resultsDiv);
  resultsDiv.textContent = "Searching…";

  const origin = originInput.value.trim().toUpperCase();
  const dest = destInput.value.trim().toUpperCase();
  const depDate = depInput.value; // <input type="date"> already yyyy-mm-dd

  if (!origin || !dest || !depDate) {
    showError("Please fill origin, destination, and date.");
    return;
  }

  const u = new URL(API_BASE + "/api/search");
  u.searchParams.set("originLocationCode", origin);
  u.searchParams.set("destinationLocationCode", dest);
  u.searchParams.set("departureDate", depDate);
  u.searchParams.set("adults", "1");
  // (Optional) add returnDate, currencyCode, max, etc.

  try {
    const r = await fetch(u, { mode: "cors" });
    const j = await r.json();

    if (!r.ok || !j.data || !Array.isArray(j.data) || j.data.length === 0) {
      showError("No results found for those inputs.");
      return;
    }

    resultsDiv.innerHTML = j.data.map(offer => {
      const itin = offer.itineraries?.[0];
      if (!itin) return "";
      const seg0 = itin.segments?.[0];
      const last = itin.segments?.[itin.segments.length - 1];
      const price = offer.price?.total ?? "?";
      const dur = (itin.duration || "").replace("PT","").toLowerCase();

      return `
        <div class="flight-card">
          <div><strong>${seg0?.departure?.iataCode || "?"}</strong> → <strong>${last?.arrival?.iataCode || "?"}</strong></div>
          <div>${seg0?.departure?.at || "?"} → ${last?.arrival?.at || "?"}</div>
          <div>Duration: ${dur}</div>
          <div><b>Price:</b> ${price}</div>
        </div>`;
    }).join("");

  } catch (e) {
    showError("Could not fetch results. Check Worker URL & secrets.");
  }
}

searchBtn.addEventListener("click", (e) => { e.preventDefault(); doSearch(); });


