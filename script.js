// ===============================
// CONFIG
// ===============================
const API_BASE = "https://amadeus-proxy.nikhilcloudonline.workers.dev";

// ===============================
// DOM ELEMENTS
// ===============================
const originInput = document.getElementById("origin");
const destInput = document.getElementById("destination");
const depInput = document.getElementById("departureDate");
const retInput = document.getElementById("returnDate");
const resultsDiv = document.getElementById("results");

let lastResults = [];
let selectedOffer = null;

// ===============================
// TRIP TYPE TOGGLE (ONE-WAY / ROUND-TRIP)
// ===============================
document.querySelectorAll("input[name='tripType']").forEach(radio => {
  radio.addEventListener("change", () => {
    const tripType = document.querySelector("input[name='tripType']:checked").value;
    document.getElementById("returnField").style.display =
      tripType === "oneway" ? "none" : "block";
  });
});
document.getElementById("returnField").style.display = "none";

// ===============================
// AUTOCOMPLETE (AIRPORT / CITY)
// ===============================
async function autocomplete(inputEl, listId) {
  const list = document.getElementById(listId);
  list.innerHTML = "";
  const query = inputEl.value.trim();
  if (query.length < 2) return;

  try {
    const r = await fetch(`${API_BASE}/api/locations?keyword=${encodeURIComponent(query)}`, {
      mode: "cors",
    });
    const j = await r.json();
    (j.data || []).forEach(loc => {
      const code = loc.iataCode || loc.address?.cityCode;
      const name = loc.name || loc.detailedName || "";
      const country = loc.address?.countryName || "";
      if (!code) return;
      const li = document.createElement("li");
      li.textContent = `${name} (${code}) — ${country}`;
      li.onclick = () => {
        inputEl.value = code;
        list.innerHTML = "";
      };
      list.appendChild(li);
    });
  } catch (err) {
    console.error("Autocomplete failed", err);
  }
}

originInput.addEventListener("input", () => autocomplete(originInput, "origin-results"));
destInput.addEventListener("input", () => autocomplete(destInput, "destination-results"));

// ===============================
// SEARCH FLIGHTS
// ===============================
document.getElementById("searchBtn").addEventListener("click", async (e) => {
  e.preventDefault();
  resultsDiv.innerHTML = "<p>Searching flights...</p>";

  const origin = originInput.value.trim().toUpperCase();
  const destination = destInput.value.trim().toUpperCase();
  const departureDate = depInput.value;
  const returnDate = retInput.value;
  const tripType = document.querySelector("input[name='tripType']:checked").value;
  const adults = document.getElementById("adults").value || 1;

  if (!origin || !destination || !departureDate) {
    resultsDiv.innerHTML = `<p style="color:red;">Please fill origin, destination, and date.</p>`;
    return;
  }

  const url = new URL(`${API_BASE}/api/search`);
  url.searchParams.set("origin", origin);
  url.searchParams.set("destination", destination);
  url.searchParams.set("date", departureDate);
  url.searchParams.set("adults", adults);
  if (tripType === "round" && returnDate) {
    url.searchParams.set("returnDate", returnDate);
  }

  try {
    const res = await fetch(url, { mode: "cors" });
    const text = await res.text();
    let j;
    try {
      j = JSON.parse(text);
    } catch {
      j = {};
    }

    if (!res.ok || !j.data) {
      resultsDiv.innerHTML = `<p style="color:red;">API error or no results.</p>`;
      console.log(text);
      return;
    }

    renderResults(j.data);
  } catch (err) {
    resultsDiv.innerHTML = `<p style="color:red;">${err.message}</p>`;
  }
});

// ===============================
// RENDER SEARCH RESULTS
// ===============================
function renderResults(data) {
  lastResults = data;
  resultsDiv.innerHTML = data.map((offer, i) => {
    const itin = offer.itineraries?.[0];
    const seg0 = itin?.segments?.[0];
    const last = itin?.segments?.[itin.segments.length - 1];
    const depTime = seg0?.departure?.at?.replace("T", " ").slice(0, 16);
    const arrTime = last?.arrival?.at?.replace("T", " ").slice(0, 16);
    const duration = (itin.duration || "").replace("PT", "").toLowerCase();
    const price = offer.price?.total ?? "?";
    const curr = offer.price?.currency ?? "";

    return `
      <div class="flight-card" style="border:1px solid #ddd;border-radius:8px;padding:12px;margin-bottom:10px;">
        <div><b>${seg0?.departure?.iataCode}</b> → <b>${last?.arrival?.iataCode}</b> (${seg0?.carrierCode})</div>
        <div>${depTime} → ${arrTime}</div>
        <div>Duration: ${duration}</div>
        <div><b>Price:</b> ${price} ${curr}</div>
        <button class="select-btn" data-index="${i}" 
          style="margin-top:8px;padding:6px 10px;background:#007bff;color:#fff;border:0;border-radius:4px;cursor:pointer;">
          Select
        </button>
      </div>
    `;
  }).join("");
}

// ===============================
// HANDLE "SELECT" CLICK → REDIRECT TO NEXT PAGE
// ===============================
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("select-btn")) {
    const index = e.target.dataset.index;
    selectOffer(index);
  }
});

function selectOffer(index) {
  selectedOffer = lastResults[index];
  localStorage.setItem("selectedOffer", JSON.stringify(selectedOffer));
  window.location.href = "flight.html"; // redirect to next page
}
