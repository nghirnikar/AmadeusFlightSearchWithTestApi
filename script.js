const API = "https://<your-worker-name>.workers.dev"; // replace with your Cloudflare worker URL

document.getElementById("searchBtn").addEventListener("click", async () => {
  const origin = document.getElementById("origin").value.trim();
  const dest = document.getElementById("destination").value.trim();
  const date = document.getElementById("date").value;
  if (!origin || !dest || !date) return alert("Enter all fields!");

  const url = `${API}/api/search?origin=${origin}&destination=${dest}&date=${date}`;
  document.getElementById("results").innerText = "Searching...";
  const res = await fetch(url);
  const data = await res.json();
  if (!data.data) return alert("No flights found or error.");

  renderResults(data.data);
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
