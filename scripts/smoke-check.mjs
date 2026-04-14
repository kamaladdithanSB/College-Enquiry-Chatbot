const baseUrl = process.env.APP_URL;

if (!baseUrl) {
  console.error("APP_URL is required. Example: APP_URL=https://your-app.vercel.app");
  process.exit(1);
}

const endpoints = [
  { path: "/api/health", expected: [200, 503] },
  { path: "/api/institutions", expected: [200] },
];

let failures = 0;

for (const endpoint of endpoints) {
  const url = `${baseUrl}${endpoint.path}`;
  try {
    const response = await fetch(url);
    const payload = await response.json().catch(() => ({}));
    const ok = endpoint.expected.includes(response.status);

    if (!ok) {
      failures += 1;
      console.error(`FAIL ${url} status=${response.status}`);
    } else {
      console.log(`OK ${url} status=${response.status}`);
    }

    if (endpoint.path === "/api/health") {
      console.log("Health payload:", JSON.stringify(payload));
    }
  } catch (error) {
    failures += 1;
    console.error(`FAIL ${url} error=${error instanceof Error ? error.message : "unknown"}`);
  }
}

if (failures > 0) {
  process.exit(1);
}

console.log("Smoke check passed.");
