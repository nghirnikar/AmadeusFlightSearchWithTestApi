// _worker.js — proxy + simple router + CORS + token caching

const AMA_OAUTH_URL = "https://test.api.amadeus.com/v1/security/oauth2/token";
const AMA_SEARCH_URL = "https://test.api.amadeus.com/v2/shopping/flight-offers";
const AMA_LOC_URL = "https://test.api.amadeus.com/v1/reference-data/locations";

let cachedToken = null;
let tokenExpiry = 0;

async function getToken(env) {
  const now = Date.now();
  if (cachedToken && now < tokenExpiry - 30_000) return cachedToken;

  const body = new URLSearchParams();
  body.set("grant_type", "client_credentials");
  body.set("client_id", env.AMADEUS_API_KEY);
  body.set("client_secret", env.AMADEUS_API_SECRET);

  const r = await fetch(AMA_OAUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!r.ok) throw new Error("Token request failed");
  const j = await r.json();
  cachedToken = j.access_token;
  tokenExpiry = Date.now() + (j.expires_in || 1800) * 1000;
  return cachedToken;
}

function cors(json, status = 200) {
  return new Response(JSON.stringify(json), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Cache-Control": "no-store",
    },
  });
}

async function handleSearch(url, env) {
  const origin = url.searchParams.get("originLocationCode");
  const dest = url.searchParams.get("destinationLocationCode");
  const date = url.searchParams.get("departureDate");
  const adults = url.searchParams.get("adults") || "1";
  const retDate = url.searchParams.get("returnDate"); // optional

  if (!origin || !dest || !date) {
    return cors({ error: "Missing required params" }, 400);
  }

  const token = await getToken(env);
  const params = new URLSearchParams({
    originLocationCode: origin,
    destinationLocationCode: dest,
    departureDate: date, // YYYY-MM-DD
    adults,
    currencyCode: "USD",
    max: "10",
  });
  if (retDate) params.set("returnDate", retDate);

  const r = await fetch(`${AMA_SEARCH_URL}?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const j = await r.json();
  return cors(j, r.status);
}

async function handleLocations(url, env) {
  const keyword = url.searchParams.get("keyword") || "";
  if (!keyword || keyword.length < 2) return cors({ data: [] });

  const token = await getToken(env);
  const params = new URLSearchParams({
    keyword,
    subType: "AIRPORT,CITY",
    "page[limit]": "7",
    sort: "analytics.travelers.score",
  });

  const r = await fetch(`${AMA_LOC_URL}?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const j = await r.json();
  return cors(j, r.status);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    if (url.pathname === "/api/locations") return handleLocations(url, env);
    if (url.pathname === "/api/search") return handleSearch(url, env);

    // Serve static site files by default
    return env.ASSETS.fetch(request);
  },
};
