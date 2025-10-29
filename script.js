const API_BASE = "https://amadeus-proxy.nikhilcloudonline.workers.dev/api/search";

document.getElementById("searchForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const origin = document.getElementById("origin").value.trim();
  const destination = document.getElementById("destination").value.trim();
  const date = document.getElementById("date").value;
  const adults = document.getElementById("adults").value;

  const url = `${API_BASE}?origin=${origin}&destination=${destination}&date=${date}&adults=${adults}`;

  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = "<p>Loading...</p>";

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.errors) {
      resultsDiv.innerHTML = `<p style="color:red;">Error: ${data.errors[0].detail}</p>`;
      return;
    }

    if (!data.data || data.data.length === 0) {
      resultsDiv.innerHTML = "<p>No flights found.</p>";
      return;
    }

    resultsDiv.innerHTML = "";
    data.data.forEach(flight => {
      const f = flight.itineraries[0];
      const dep = f.segments[0].departure;
      const arr = f.segments[f.segments.length - 1].arrival;
      const airline = f.segments[0].carrierCode;
      const duration = f.duration.replace("PT", "").replace("H", "h ").replace("M", "m");

      const price = flight.price.total;
      const stops = f.segments.length - 1;

      const card = `
        <div class="card">
          <strong>${airline}</strong><br>
          ${dep.iataCode} → ${arr.iataCode}<br>
          Duration: ${duration}<br>
          Stops: ${stops}<br>
          Price: €${price}
        </div>
      `;
      resultsDiv.innerHTML += card;
    });
  } catch (err) {
    resultsDiv.innerHTML = `<p style="color:red;">Error: ${err.message}</p>`;
  }
});
