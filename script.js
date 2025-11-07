// script.js — wire up form, call worker endpoints, render

// CHANGE THIS to your Worker URL (no trailing slash)
const API_BASE = "https://amadeus-proxy.nikhilcloudonline.workers.dev";

const originInput = document.querySelector('#origin');
const destInput = document.querySelector('#destination');
const dateInput = document.querySelector('#departDate');
const returnInput = document.querySelector('#returnDate'); // optional
const adultsInput = document.querySelector('#adults');
const tripTypeSelect = document.querySelector('#tripType');
const resultsDiv = document.querySelector('#results');

function toISO(dateStr) {
  // accepts dd/mm/yyyy or yyyy-mm-dd
  if (!dateStr) return "";
  if (dateStr.includes("/")) {
    const [d, m, y] = dateStr.split("/").map(s => s.trim());
    return `${y}-${m.padStart(2,"0")}-${d.padStart(2,"0")}`;
  }
  return dateStr; // assume already ISO
}

async function search() {
  resultsDiv.innerHTML = "Searching…";

  const origin = originInput.value.trim().toUpperCase();
  const dest = destInput.value.trim().toUpperCase();
  const depISO = toISO(dateInput.value);
  const retISO = tripTypeSelect.value === "return" ? toISO(returnInput.value) : "";

  const u = new URL(API_BASE + "/api/search");
  u.searchParams.set("originLocationCode", origin);
  u.searchParams.set("destinationLocationCode", dest);
  u.searchParams.set("departureDate", depISO);
  u.searchParams.set("adults", adultsInput.value || "1");
  if (retISO) u.searchParams.set("returnDate", retISO);

  const r = await fetch(u, { mode: "cors" });
  const j = await r.json();

  if (!r.ok || !j.data) {
    resultsDiv.innerHTML = `<div class="error">No results. ${j.error || ""}</div>`;
    return;
  }

  // Render the first 10 offers
  resultsDiv.innerHTML = j.data.map((offer) => {
    const itin = offer.itineraries[0];
    const seg0 = itin.segments[0];
    const lastSeg = itin.segments[itin.segments.length - 1];
    const price = offer.price?.total || "?";
    return `
      <div class="flight-card">
        <div><strong>${seg0.departure.iataCode}</strong> → <strong>${lastSeg.arrival.iataCode}</strong></div>
        <div>${seg0.departure.at} → ${lastSeg.arrival.at}</div>
        <div>Duration: ${itin.duration.replace("PT","").toLowerCase()}</div>
        <div><b>Price:</b> ${price}</div>
      </div>`;
  }).join("");
}

document.querySelector('#searchBtn').addEventListener('click', (e) => {
  e.preventDefault();
  search();
});

// --- Airport autocomplete (calls worker /api/locations)
function attachAutocomplete(inputEl) {
  let box;
  let timer;

  function ensureBox() {
    if (!box) {
      box = document.createElement('div');
      box.className = 'autocomplete-box';
      inputEl.parentNode.appendChild(box);
    }
    box.innerHTML = "";
    box.style.display = "block";
  }
  function hideBox() { if (box) box.style.display = "none"; }

  inputEl.addEventListener('input', () => {
    const q = inputEl.value.trim();
    clearTimeout(timer);
    if (q.length < 2) { hideBox(); return; }
    timer = setTimeout(async () => {
      ensureBox();
      const u = new URL(API_BASE + "/api/locations");
      u.searchParams.set("keyword", q);
      const r = await fetch(u, { mode: "cors" });
      const j = await r.json();
      const items = (j.data || []).map(x => {
        const code = x.iataCode || x.address?.cityCode || "";
        const name = x.name || x.detailedName || "";
        return { code, name };
      }).filter(x => x.code);

      box.innerHTML = items.map(it =>
        `<div class="item" data-code="${it.code}">${it.code} — ${it.name}</div>`
      ).join("");

      box.querySelectorAll('.item').forEach(el => {
        el.addEventListener('click', () => {
          inputEl.value = el.getAttribute('data-code');
          hideBox();
        });
      });
    }, 250); // debounce
  });

  inputEl.addEventListener('blur', () => setTimeout(hideBox, 200));
}

attachAutocomplete(originInput);
attachAutocomplete(destInput);

// Trip type toggle
tripTypeSelect.addEventListener('change', () => {
  document.querySelector('#returnRow').style.display =
    tripTypeSelect.value === 'return' ? 'block' : 'none';
});


document.getElementById("searchBtn").addEventListener("click", async () => {
  const origin = document.getElementById("origin").value.trim().toUpperCase();
  const dest = document.getElementById("destination").value.trim().toUpperCase();
  const date = document.getElementById("date").value;

  if (!origin || !dest || !date) return alert("Please fill in all fields.");

  const url = `${API}/api/search?origin=${origin}&destination=${dest}&date=${date}`;
  document.getElementById("results").innerText = "🔍 Searching for flights...";

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (!data.data || data.data.length === 0) {
      document.getElementById("results").innerText = "❌ No flights found.";
      return;
    }

    renderResults(data.data);
  } catch (err) {
    console.error("Search failed:", err);
    document.getElementById("results").innerText = "❌ Error fetching flights.";
  }
});

function renderResults(offers) {
  const box = document.getElementById("results");
  box.innerHTML = "";
  window._offers = offers;

  offers.forEach((offer, i) => {
    const lastSeg = offer.itineraries[0].segments.at(-1);
    const div = document.createElement("div");
    div.className = "flight-card";

    div.innerHTML = `
      <p><strong>${offer.itineraries[0].segments[0].departure.iataCode}</strong> → <strong>${lastSeg.arrival.iataCode}</strong></p>
      <p>✈️ Total Price: <strong>${offer.price.total} ${offer.price.currency}</strong></p>
      <button onclick="selectOffer(${i})">Select</button>
    `;

    box.appendChild(div);
  });
}

function selectOffer(i) {
  localStorage.setItem("selectedOffer", JSON.stringify(window._offers[i]));
  location.href = "review.html";
}

