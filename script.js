// ===== YOUR CLOUDFLARE WORKER ENDPOINT =====
const API_BASE = "https://amadeus-proxy.nikhilcloudonline.workers.dev";

// ===== DOM ELEMENTS =====
const originInput  = document.getElementById("origin");
const destInput    = document.getElementById("destination");
const depInput     = document.getElementById("departureDate");
const retInput     = document.getElementById("returnDate");
const resultsDiv   = document.getElementById("results");
const previewDiv   = document.getElementById("preview");

let selectedOffer = null;
let lastResults = [];

// ====== AUTO HIDE RETURN FIELD FOR ONE-WAY ======
document.querySelectorAll("input[name='tripType']").forEach(r => {
  r.addEventListener("change", () => {
    const tripType = document.querySelector("input[name='tripType']:checked").value;
    document.getElementById("returnField").style.display = tripType === "oneway" ? "none" : "block";
  });
});
document.getElementById("returnField").style.display = "none";

// ===== AUTOCOMPLETE =====
async function auto(el, listId) {
  const list = document.getElementById(listId);
  list.innerHTML = "";
  const q = el.value.trim();
  if (q.length < 2) return;

  try {
    const r = await fetch(`${API_BASE}/api/locations?keyword=${encodeURIComponent(q)}`, { mode: "cors" });
    const j = await r.json();

    (j.data || []).forEach(loc => {
      const code = loc.iataCode || loc.address?.cityCode;
      if (!code) return;
      const name = loc.name || loc.detailedName || loc.address?.cityName || "";
      const country = loc.address?.countryName || "";
      const li = document.createElement("li");
      li.textContent = `${name} (${code}) — ${country}`;
      li.onclick = () => { el.value = code; list.innerHTML = ""; };
      list.appendChild(li);
    });
  } catch (e) {
    console.log("Autocomplete error", e);
  }
}

originInput.addEventListener("input", () => auto(originInput, "origin-results"));
destInput.addEventListener("input", () => auto(destInput, "destination-results"));

// ===== SHOW MESSAGES =====
function show(msg, isErr = false) {
  resultsDiv.innerHTML = `<div style="color:${isErr ? '#b00020' : '#111'}">${msg}</div>`;
}

// ===== SEARCH =====
document.getElementById("searchBtn").addEventListener("click", async (e) => {
  e.preventDefault();
  show("Searching…");

  const origin = originInput.value.trim().toUpperCase();
  const dest   = destInput.value.trim().toUpperCase();
  const date   = depInput.value;
  const ret    = retInput.value;
  const tripType = document.querySelector("input[name='tripType']:checked").value;
  const adults = document.getElementById("adults").value || 1;

  if (!origin || !dest || !date) {
    show("Please fill origin, destination, and departure date.", true);
    return;
  }

  const url = new URL(`${API_BASE}/api/search`);
  url.searchParams.set("origin", origin);
  url.searchParams.set("destination", dest);
  url.searchParams.set("date", date);
  url.searchParams.set("adults", adults);
  if (tripType === "round" && ret) url.searchParams.set("returnDate", ret);

  try {
    const r = await fetch(url, { mode: "cors" });
    if (!r.ok) {
      const errTxt = await r.text();
      show(`API Error ${r.status}: ${errTxt.slice(0, 200)}`, true);
      return;
    }

    const j = await r.json();
    if (!j.data?.length) {
      show("No flights found.", true);
      return;
    }

    renderResults(j.data);

  } catch (e) {
    show(`Fetch error: ${e.message}`, true);
  }
});

// ===== DISPLAY SEARCH RESULTS =====
function renderResults(data) {
  lastResults = data;
  resultsDiv.innerHTML = data.map((offer, i) => {
    const itin = offer.itineraries?.[0];
    const seg0 = itin?.segments?.[0];
    const last = itin?.segments?.[itin.segments.length - 1];
    const price = offer.price?.total ?? "?";
    const curr = offer.price?.currency ?? "";
    const depTime = seg0?.departure?.at?.replace("T", " ").slice(0, 16);
    const arrTime = last?.arrival?.at?.replace("T", " ").slice(0, 16);

    return `
      <div class="flight-card">
        <div><b>${seg0?.departure?.iataCode}</b> → <b>${last?.arrival?.iataCode}</b> (${seg0?.carrierCode})</div>
        <div>${depTime} → ${arrTime}</div>
        <div>Duration: ${(itin.duration || "").replace("PT", "").toLowerCase()}</div>
        <div><b>Price:</b> ${price} ${curr}</div>
        <button class="select-btn" data-index="${i}"
          style="margin-top:8px;padding:6px 10px;background:#007bff;color:#fff;border:0;border-radius:4px;cursor:pointer;">
          Select
        </button>
      </div>`;
  }).join("");

  // Bind select buttons
  document.querySelectorAll(".select-btn").forEach(btn => {
    btn.addEventListener("click", () => selectOffer(btn.dataset.index));
  });
}

// ===== SELECT OFFER =====
function selectOffer(i) {
  selectedOffer = lastResults[i];
  const price = selectedOffer.price?.total;
  const curr = selectedOffer.price?.currency;

  previewDiv.innerHTML = `
    <div style="border:2px solid #007bff;padding:14px;border-radius:10px;margin-top:15px;">
      <h4>Selected Flight</h4>
      <p><b>Total:</b> ${price} ${curr}</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <button id="bookBtn" style="padding:8px 14px;background:#28a745;color:#fff;border:0;border-radius:4px;">Book Now</button>
        <button id="cancelBtn" style="padding:8px 14px;background:#dc3545;color:#fff;border:0;border-radius:4px;">Cancel Order</button>
        <button id="payBtn" style="padding:8px 14px;background:#ffc107;color:#000;border:0;border-radius:4px;">Simulate Payment</button>
      </div>
      <div id="orderResult" style="margin-top:10px;font-size:14px;"></div>
    </div>`;
}

// ===== HANDLE BOOK / CANCEL / PAY =====
document.addEventListener("click", async (e) => {
  const id = e.target.id;

  // --- BOOK ---
  if (id === "bookBtn" && selectedOffer) {
    e.target.disabled = true;
    e.target.textContent = "Booking...";
    try {
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const j = await r.json();
      if (r.ok && j.data?.id) {
        window.lastOrderId = j.data.id;
        document.getElementById("orderResult").innerHTML = `<b>Booking created:</b> ${j.data.id}`;
      } else {
        document.getElementById("orderResult").innerHTML = `<b>Booking failed:</b> ${JSON.stringify(j)}`;
      }
    } catch (err) {
      alert("Booking failed: " + err.message);
    } finally {
      e.target.disabled = false;
      e.target.textContent = "Book Now";
    }
  }

  // --- CANCEL ---
  if (id === "cancelBtn") {
    if (!window.lastOrderId) {
      alert("No order ID yet! Book first.");
      return;
    }
    if (!confirm("Cancel this order?")) return;
    e.target.disabled = true;
    e.target.textContent = "Cancelling...";
    try {
      const r = await fetch(`${API_BASE}/api/cancel/${window.lastOrderId}`, { method: "DELETE" });
      const j = await r.json();
      alert(`Cancelled: ${j.status}`);
      document.getElementById("orderResult").innerHTML = `<b>Status:</b> ${j.status}`;
    } catch (err) {
      alert("Cancel failed: " + err.message);
    } finally {
      e.target.disabled = false;
      e.target.textContent = "Cancel Order";
    }
  }

  // --- PAYMENT ---
  if (id === "payBtn") {
    if (!selectedOffer) {
      alert("Select a flight first.");
      return;
    }
    e.target.disabled = true;
    e.target.textContent = "Processing...";
    setTimeout(() => {
      e.target.disabled = false;
      e.target.textContent = "Simulate Payment";
      const price = selectedOffer.price?.total;
      const curr = selectedOffer.price?.currency;
      document.getElementById("orderResult").innerHTML = `
        ✅ Payment successful! <br>Charged ${price} ${curr}<br>
        <b>Transaction ID:</b> PMT-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
    }, 2000);
  }
});
