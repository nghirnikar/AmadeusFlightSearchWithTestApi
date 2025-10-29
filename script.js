// script.js
const API_BASE = "https://amadeus-proxy.nikhilcloudonline.workers.dev/api/search";

document.getElementById("searchForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const origin = document.getElementById("origin").value.trim();
  const destination = document.getElementById("destination").value.trim();
  let date = document.getElementById("date").value.trim();
  const adults = document.getElementById("adults").value;

  // normalize date to YYYY-MM-DD if user typed 30/10/2025 manually
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
    const [d,m,y] = date.split("/");
    date = `${y}-${m}-${d}`;
  }

  const url = `${API_BASE}?origin=${origin}&destination=${destination}&date=${date}&adults=${adults}`;

  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = "<p>Loading...</p>";

  try {
    const res = await fetch(url);
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`HTTP ${res.status} – ${t.slice(0,200)}`);
    }
    const data = await res.json();
    // ... render as before ...
  } catch (err) {
    resultsDiv.innerHTML = `<p style="color:red;">Error: ${err.message}</p>`;
  }
});

