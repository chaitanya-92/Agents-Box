#!/usr/bin/env node
const API_KEY = "rnd_JpCG81whZjCm9n8g5IBp09tqRsnF";
const res = await fetch("https://api.render.com/v1/services?limit=20", {
  headers: { Authorization: `Bearer ${API_KEY}`, Accept: "application/json" }
});
const data = await res.json();
console.log("HTTP", res.status);
if (Array.isArray(data)) {
  data.forEach(({ service }) => {
    console.log(`ID: ${service.id}  Name: ${service.name}  Status: ${service.suspended}`);
  });
} else {
  console.log(JSON.stringify(data, null, 2));
}
