// ===== CONFIG: set to YOUR real workers.dev URL =====
const API_BASE = "https://amadeus-proxy.nikhilcloudonline.workers.dev"; // ✅ No trailing slash

// ===== DOM =====
const originInput  = document.getElementById("origin");
const destInput    = document.getElementById("destination");
const depInput     = document.getElementById("departureDate");
const resultsDiv   = document.getElementById("results");

// Add a tiny debug line under the form
const dbg = document.createElement("div");
dbg.style.cssText = "margin:8px 0;color:#555;font-size:12px";
dbg.id = "debug";
resultsDiv.parentNode.insertBefore(dbg, resultsDiv);

// Helpers
function show(msg, isErr=false){ 
  resultsDiv.innerHTML = `<div style="color:${isErr?'#b00020':'#111'}">${msg}</div>`; 
}
function setDbg(t){ 
  document.getElementById("debug").textContent = t; 
}

// Quick ping to prove API_BASE is reachable
async function ping() {
  try {
    const r = await fetch(API_BASE + "/api/search?origin=DXB&destination=LHR&date=2025-12-05", {mode:"cors"});
    setDbg(`PING ${API_BASE}: HTTP ${r.status}`);
  } catch (e) {
    setDbg(`PING failed: ${e.message}`);
  }
}
ping();

// Autocomplete (optional – can comment out if you want)
async function auto(el, listId){
  const list = document.getElementById(listId);
  list.innerHTML = "";
  const q = el.value.trim();
  if (q.length < 2) return;
  try{
    // (Optional: You can create /api/locations endpoint in Worker later)
    const r = await fetch(`${API_BASE}/api/locations?keyword=${encodeURIComponent(q)}`, {mode:"cors"});
    const j = await r.json();
    (j.data||[]).slice(0,7).forEach(x=>{
      const code = x.iataCode || x.address?.cityCode; 
      if(!code) return;
      const li = document.createElement("li");
      li.textContent = `${code} — ${x.name || x.detailedName || ""}`;
      li.onclick = ()=>{ el.value = code; list.innerHTML=""; };
      list.appendChild(li);
    });
  }catch(e){ /* ignore */ }
}
originInput.addEventListener("input", ()=>auto(originInput, "origin-results"));
destInput.addEventListener("input", ()=>auto(destInput, "destination-results"));

// ===== SEARCH =====
document.getElementById("searchBtn").addEventListener("click", async (e)=>{
  e.preventDefault();
  resultsDiv.innerHTML = "Searching…";

  const origin = originInput.value.trim().toUpperCase();
  const dest   = destInput.value.trim().toUpperCase();
  const date   = depInput.value; // YYYY-MM-DD

  if (!origin || !dest || !date) {
    show("Please fill origin, destination, and date.", true);
    return;
  }

  // ✅ FIX: match Cloudflare Worker route and parameter names
  const url = new URL(API_BASE + "/api/search");
  url.searchParams.set("origin", origin);
  url.searchParams.set("destination", dest);
  url.searchParams.set("date", date);

  try {
    const r = await fetch(url, {mode:"cors"});
    const text = await r.text(); // read raw so we can show errors
    let j; 
    try { j = JSON.parse(text); } catch { j = { raw:text }; }

    if (!r.ok) { 
      show(`API ${r.status}: ${j.error||j.title||JSON.stringify(j).slice(0,200)}`, true); 
      return; 
    }

    if (!j.data || !Array.isArray(j.data) || j.data.length===0){ 
      show("No results returned for those inputs.", true); 
      return; 
    }

    // ✅ Show results
    resultsDiv.innerHTML = j.data.map(offer=>{
      const itin = offer.itineraries?.[0]; if(!itin) return "";
      const seg0 = itin.segments?.[0]; 
      const last = itin.segments?.[itin.segments.length-1];
      const price = offer.price?.total ?? "?";
      const carrier = seg0?.carrierCode || "";
      return `<div class="flight-card">
        <div><b>${seg0?.departure?.iataCode||"?"}</b> → <b>${last?.arrival?.iataCode||"?"}</b> (${carrier})</div>
        <div>${seg0?.departure?.at||"?"} → ${last?.arrival?.at||"?"}</div>
        <div>Duration: ${(itin.duration||"").replace("PT","").toLowerCase()}</div>
        <div><b>Price:</b> ${price} ${offer.price?.currency||""}</div>
      </div>`;
    }).join("");

  } catch (e) {
    show(`Fetch error: ${e.message}`, true);
  }
});
