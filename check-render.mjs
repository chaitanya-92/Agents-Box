#!/usr/bin/env node
const API_KEY    = "rnd_JpCG81whZjCm9n8g5IBp09tqRsnF";
const SERVICE_ID = "srv-d8u9obrtqb8s73b094eg";
const h = { Authorization: `Bearer ${API_KEY}`, Accept: "application/json" };

const res = await fetch(`https://api.render.com/v1/services/${SERVICE_ID}/deploys?limit=3`, { headers: h });
const raw = await res.text();
console.log("HTTP", res.status);
console.log(JSON.stringify(JSON.parse(raw), null, 2));
