const cancelRes = await fetch('https://<your-worker>.workers.dev/api/cancel/' + orderId, {
  method: 'DELETE'
}).then(r => r.json());

// { status: "CANCELLED", orderId }
