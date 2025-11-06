const API = "https://amadeus-proxy.nikhilcloudonline.workers.dev"; // your Cloudflare Worker

// Dummy data for airport autocomplete
const airportList = [
  { city: "Dubai", code: "DXB" },
  { city: "Abu Dhabi", code: "AUH" },
  { city: "London", code: "LHR" },
  { city: "Delhi", code: "DEL" },
  { city: "Mumbai", code: "BOM" },
  { city: "Singapore", code: "SIN" },
  { city: "Paris", code: "CDG" },
  { city: "New York", code: "JFK" },
  { city: "Doha", code: "DOH" }
];

function setupAutocomplete(inputId, resultsId) {
  const input = document.getElementById(inputId);
  const resultsBox = document.getElementById(resultsId);

  input.addEventListener("input", () => {
    const query = input.value.toLowerCase();
    resultsBox.innerHTML = "";

    if (!query) return;

    const matches = airportList.filter(airport =>
      airport.city.toLowerCase().startsWith(query) ||
      airport.code.toLowerCase().startsWith(query)
    );

    matches.forEach(match => {
      const li = document.createElement("li");
      li.textContent = `${match.city} (${match.code})`;
      li.onclick = () => {
        input.value = match.code; // Only code is used for search
        resultsBox.innerHTML = "";
      };
      resultsBox.appendChild(li);
    });
  });

  document.addEventListener("click", (e) => {
    if (!resultsBox.contains(e.target) && e.target !== input) {
      resultsBox.innerHTML = "";
    }
  });
}

setupAutocomplete("origin", "origin-results");
setupAutocomplete("destination", "destination-results");

document.getElementById("searchBtn").addEventListener("click", async () => {
  const origin = document.getElementById("origin").value.trim().toUpperCase();
  const dest = document.getElementById("destination").value.trim().toUpperCase();
  const date = document.getElementById("departureDate").value;
  if (!origin || !dest || !date) return alert("Enter all fields!");

  const url = `${API}/api/search?origin=${origin}&destination=${dest}&date=${date}`;
  document.getElementById("results").innerText = "Searching...";
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (!data.data) return alert("No flights found or error.");
    renderResults(data.data);
  } catch (err) {
    alert("Error fetching flights. Please check API.");
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
      <p>${offer.itineraries[0].segments[0].departure.iataCode} → ${lastSeg.arrival.iataCode}</p>
      <p>Price: ${offer.price.total} ${offer.price.currency}</p>
      <button onclick="selectOffer(${i})">Select</button>
    `;
    box.appendChild(div);
  });
}

function selectOffer(i) {
  localStorage.setItem("selectedOffer", JSON.stringify(window._offers[i]));
  location.href = "review.html";
}


