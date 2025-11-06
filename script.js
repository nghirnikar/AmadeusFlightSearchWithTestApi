const API = "https://amadeus-proxy.nikhilcloudonline.workers.dev"; // Cloudflare Worker URL

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
