import { buildSyntheticPayload } from "../../../../lib/payload";

function chunkString(value, chunkSize) {
  const chunks = [];

  for (let index = 0; index < value.length; index += chunkSize) {
    chunks.push(value.slice(index, index + chunkSize));
  }

  return chunks;
}

export async function GET(request, { params }) {
  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  const variant = searchParams.get("variant") ?? "0";
  const kb = searchParams.get("kb") ?? "256";
  const sections = searchParams.get("sections") ?? "32";
  const payload = buildSyntheticPayload(`${slug}:${variant}`, { kb, sections });
  const body = JSON.stringify(payload);
  const encoder = new TextEncoder();
  const chunks = chunkString(body, 64 * 1024);

  return new Response(
    new ReadableStream({
      start(controller) {
        for (const chunk of chunks) {
          controller.enqueue(encoder.encode(chunk));
        }
        controller.close();
      },
    }),
    {
      headers: {
        "cache-control": "public, s-maxage=3600",
        "content-type": "application/json; charset=utf-8",
      },
    },
  );
}
