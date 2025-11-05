const order = await fetch('https://<your-worker>.workers.dev/api/book', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    offer: finalOffer,
    passenger: { firstName, lastName, email, phone, dob }
  })
}).then(r => r.json());

// order.data.id  -> Amadeus Order ID (save it; show to user)
// order.data.associatedRecords[0].reference -> PNR (if available)
