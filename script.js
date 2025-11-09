// ===== CONFIG =====
const API_BASE = "https://amadeus-proxy.nikhilcloudonline.workers.dev"; // no trailing slash

// ===== DOM =====
const originInput  = document.getElementById("origin");
const destInput    = document.getElementById("destination");
const depInput     = document.getElementById("departureDate");
const resultsDiv   = document.getElementById("results");
const previewDiv   = document.getElementById("preview");

function show(msg, isErr=false){ 
  resultsDiv.innerHTML = `<div style="color:${isErr?'#b00020':'#111'}">${msg}</div>`; 
}

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

    window.lastResults = j.data;
    renderResults(j.data);

  } catch (e) {
    show(`Fetch error: ${e.message}`, true);
  }
});

// ===== RENDER RESULTS =====
let selectedOffer = null;

function renderResults(data) {
  resultsDiv.innerHTML = data.map((offer, i) => {
    const itin = offer.itineraries?.[0];
    const seg0 = itin?.segments?.[0];
    const last = itin?.segments?.[itin.segments.length-1];
    const price = offer.price?.total ?? "?";
    const carrier = seg0?.carrierCode || "?";
    return `
      <div class="flight-card" style="border:1px solid #ddd;padding:10px;border-radius:8px;margin:10px 0">
        <div><b>${seg0?.departure?.iataCode}</b> → <b>${last?.arrival?.iataCode}</b> (${carrier})</div>
        <div>${seg0?.departure?.at.slice(0,16)} → ${last?.arrival?.at.slice(0,16)}</div>
        <div>Duration: ${(itin.duration||"").replace("PT","").toLowerCase()}</div>
        <div><b>Price:</b> ${price} ${offer.price?.currency||""}</div>
        <button onclick="selectOffer(${i})" style="margin-top:6px;padding:6px 10px;background:#007bff;color:#fff;border:0;border-radius:4px;cursor:pointer;">Select</button>
      </div>`;
  }).join("");
}

// ===== SELECT OFFER =====
window.selectOffer = function(i){
  selectedOffer = window.lastResults[i];
  const price = selectedOffer.price?.total;
  const curr  = selectedOffer.price?.currency;
  previewDiv.innerHTML = `
    <div style="border:2px solid #007bff;padding:12px;border-radius:10px;margin-top:15px;">
      <h4>Selected Flight</h4>
      <p><b>Total:</b> ${price} ${curr}</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <button id="bookBtn" style="padding:8px 14px;background:#28a745;color:#fff;border:0;border-radius:4px;">Book Now</button>
        <button id="cancelBtn" style="padding:8px 14px;background:#dc3545;color:#fff;border:0;border-radius:4px;">Cancel Order</button>
        <button id="payBtn" style="padding:8px 14px;background:#ffc107;color:#000;border:0;border-radius:4px;">Simulate Payment</button>
      </div>
      <div id="orderResult" style="margin-top:10px;font-size:14px;"></div>
    </div>`;
};

// ===== EVENT HANDLERS =====
document.addEventListener("click", async e=>{
  // --- BOOK ORDER ---
  if (e.target.id === "bookBtn" && selectedOffer){
    e.target.disabled = true;
    e.target.textContent = "Booking...";
    try{
      const body = {
        offer: selectedOffer,
        passenger: {
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
          dob: "1990-01-01"
        }
      };
      const r = await fetch(`${API_BASE}/api/book`, {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify(body)
      });
      const j = await r.json();
      if (r.ok && j.data?.id){
        window.lastOrderId = j.data.id;
        document.getElementById("orderResult").innerHTML = `<b>Booking created:</b> ${j.data.id}`;
      } else {
        document.getElementById("orderResult").innerHTML = `<b>Booking failed:</b> ${JSON.stringify(j)}`;
      }
    }catch(err){
      alert("Booking failed: "+err.message);
    }finally{
      e.target.disabled = false;
      e.target.textContent = "Book Now";
    }
  }

  // --- CANCEL ORDER ---
  if (e.target.id === "cancelBtn"){
    if(!window.lastOrderId){ alert("No order ID yet! Book first."); return; }
    if(!confirm("Cancel this order?")) return;
    e.target.disabled = true;
    e.target.textContent = "Cancelling...";
    try{
      const r = await fetch(`${API_BASE}/api/cancel/${window.lastOrderId}`, {method:"DELETE"});
      const j = await r.json();
      alert(`Cancelled: ${j.status}`);
      document.getElementById("orderResult").innerHTML = `<b>Status:</b> ${j.status}`;
    }catch(err){
      alert("Cancel failed: "+err.message);
    }finally{
      e.target.disabled = false;
      e.target.textContent = "Cancel Order";
    }
  }

  // --- PAYMENT (SIMULATION) ---
  if (e.target.id === "payBtn"){
    if(!selectedOffer){ alert("Select a flight first."); return; }
    e.target.disabled = true;
    e.target.textContent = "Processing...";
    setTimeout(()=>{
      e.target.disabled = false;
      e.target.textContent = "Simulate Payment";
      const price = selectedOffer.price?.total;
      const curr  = selectedOffer.price?.currency;
      document.getElementById("orderResult").innerHTML = `
        ✅ Payment successful! <br>Charged ${price} ${curr}<br>
        <b>Transaction ID:</b> PMT-${Math.random().toString(36).slice(2,10).toUpperCase()}`;
    }, 2000);
  }
});
