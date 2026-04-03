import { unstable_noStore as noStore } from "next/cache";

export async function GET(request) {
  noStore();
  const url = new URL(request.url);
  const memory = process.memoryUsage();

  return Response.json(
    {
      ok: true,
      path: url.pathname,
      query: Object.fromEntries(url.searchParams),
      pid: process.pid,
      uptimeSec: Math.round(process.uptime()),
      memory,
      rssMb: Math.round(memory.rss / 1024 / 1024),
      heapUsedMb: Math.round(memory.heapUsed / 1024 / 1024),
      externalMb: Math.round(memory.external / 1024 / 1024),
      arrayBuffersMb: Math.round(memory.arrayBuffers / 1024 / 1024),
    },
    {
      headers: {
        "cache-control": "no-store, max-age=0",
      },
    },
  );
}
