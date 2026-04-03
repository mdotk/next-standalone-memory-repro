import { getSyntheticPayload } from "../../../../lib/payload";

export async function GET(request, { params }) {
  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  const variant = searchParams.get("variant") ?? "0";
  const kb = searchParams.get("kb") ?? "256";

  const payload = await getSyntheticPayload(`${slug}:${variant}`, {
    kb,
    sections: 32,
  });

  return Response.json({
    ok: true,
    slug,
    variant,
    payload,
  });
}
