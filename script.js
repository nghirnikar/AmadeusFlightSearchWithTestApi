// ===== CONFIG =====
const API_BASE = "https://amadeus-proxy.nikhilcloudonline.workers.dev"; // no slash at end

// ===== DOM =====
const originInput  = document.getElementById("origin");
const destInput    = document.getElementById("destination");
const depInput     = document.getElementById("departureDate");
const resultsDiv   = document.getElementById("results");

// Debug line
const dbg = document.createElement("div");
dbg.style.cssText = "margin:8px 0;color:#555;font-size:12px";
dbg.id = "debug";
resultsDiv.parentNode.insertBefore(dbg, resultsDiv);

function show(msg, isErr=false){ 
  resultsDiv.innerHTML = `<div style="color:${isErr?'#b00020':'#111'}">${msg}</div>`; 
}
function setDbg(t){ 
  document.getElementById("debug").textContent = t; 
}

// Ping test
async function ping() {
  try {
    const r = await fetch(`${API_BASE}/api/search?origin=DXB&destination=LHR&date=2025-12-05`, {mode:"cors"});
    setDbg(`PING ${API_BASE}: HTTP ${r.status}`);
  } catch (e) {
    setDbg(`PING failed: ${e.message}`);
  }
}
ping();

// ===== SEARCH =====
document.getElementById("searchBtn").addEventListener("click", async (e)=>{
  e.preventDefault();
  show("Searching…");

  const origin = originInput.value.trim().toUpperCase();
  const dest   = destInput.value.trim().toUpperCase();
  const date   = depInput.value;

  if (!origin || !dest || !date) {
    show("Please fill origin, destination, and date.", true);
    return;
  }

  const url = `${API_BASE}/api/search?origin=${origin}&destination=${dest}&date=${date}`;

  try {
    const r = await fetch(url, {mode:"cors"});
    if (!r.ok) {
      const errTxt = await r.text();
      show(`API Error ${r.status}: ${errTxt.slice(0,200)}`, true);
      return;
    }

    const j = await r.json();
    if (!j.data || !Array.isArray(j.data) || j.data.length === 0) {
      show("No results returned for those inputs.", true);
      return;
    }

    // Build flight cards
    resultsDiv.innerHTML = j.data.map(offer=>{
      const itin = offer.itineraries?.[0]; if(!itin) return "";
      const seg0 = itin.segments?.[0]; 
      const last = itin.segments?.[itin.segments.length-1];
      const price = offer.price?.total ?? "?";
      const carrier = seg0?.carrierCode || "?";
      return `
        <div class="flight-card">
          <div><b>${seg0?.departure?.iataCode||"?"}</b> → <b>${last?.arrival?.iataCode||"?"}</b> (${carrier})</div>
          <div>${seg0?.departure?.at?.slice(0,16)||"?"} → ${last?.arrival?.at?.slice(0,16)||"?"}</div>
          <div>Duration: ${(itin.duration||"").replace("PT","").toLowerCase()}</div>
          <div><b>Price:</b> ${price} ${offer.price?.currency||""}</div>
        </div>
      `;
    }).join("");

  } catch (e) {
    show(`Fetch error: ${e.message}`, true);
  }
});
