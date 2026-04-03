const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:3000";
const durationMs = Number.parseInt(process.env.DURATION_MS ?? "300000", 10);
const concurrency = Number.parseInt(process.env.CONCURRENCY ?? "24", 10);
const pageWeightKb = Number.parseInt(process.env.PAGE_WEIGHT_KB ?? "256", 10);
const apiWeightKb = Number.parseInt(process.env.API_WEIGHT_KB ?? "256", 10);
const mix = (process.env.MIX ?? "page,api,page,page").split(",");
const maxLoggedFailures = Number.parseInt(process.env.MAX_LOGGED_FAILURES ?? "20", 10);

let counter = 0;
let loggedFailures = 0;

function logFailure(message, error) {
  if (loggedFailures >= maxLoggedFailures) {
    return;
  }

  loggedFailures += 1;
  console.error(message, error);

  if (loggedFailures === maxLoggedFailures) {
    console.error(
      `[load] reached MAX_LOGGED_FAILURES=${maxLoggedFailures}; suppressing further request errors`,
    );
  }
}

function nextRequestPath() {
  const requestNumber = counter++;
  const kind = mix[requestNumber % mix.length];
  const slug = `slug-${Date.now()}-${requestNumber}`;
  const variant = `${requestNumber % 1000}`;

  if (kind === "api") {
    return `/api/payload/${slug}?variant=${variant}&kb=${apiWeightKb}`;
  }

  return `/${slug}?variant=${variant}&kb=${pageWeightKb}`;
}

async function worker(workerId, deadline) {
  let completed = 0;
  let failed = 0;

  while (Date.now() < deadline) {
    const path = nextRequestPath();
    const url = `${baseUrl}${path}`;

    try {
      const response = await fetch(url, {
        headers: {
          "user-agent": `memory-repro-load/${workerId}`,
          "x-memory-repro": "1",
        },
      });

      await response.arrayBuffer();

      if (!response.ok) {
        failed += 1;
        logFailure(`[worker ${workerId}] ${response.status} ${path}`);
      } else {
        completed += 1;
      }
    } catch (error) {
      failed += 1;
      logFailure(`[worker ${workerId}] request failed`, error);
    }
  }

  return { completed, failed };
}

async function main() {
  const deadline = Date.now() + durationMs;
  console.log(
    JSON.stringify({
      baseUrl,
      durationMs,
      concurrency,
      pageWeightKb,
      apiWeightKb,
      mix,
    }),
  );

  const results = await Promise.all(
    Array.from({ length: concurrency }, (_, index) => worker(index + 1, deadline)),
  );

  const totals = results.reduce(
    (acc, result) => {
      acc.completed += result.completed;
      acc.failed += result.failed;
      return acc;
    },
    { completed: 0, failed: 0 },
  );

  console.log(JSON.stringify(totals));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
