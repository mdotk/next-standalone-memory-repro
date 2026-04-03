import crypto from "node:crypto";

function toPositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

function makeChunk(seed, index, targetChars) {
  const parts = [];
  let current = 0;

  while (current < targetChars) {
    const digest = crypto
      .createHash("sha256")
      .update(`${seed}:${index}:${parts.length}`)
      .digest("hex");
    const piece = `${seed}:${index}:${parts.length}:${digest}:`;
    parts.push(piece);
    current += piece.length;
  }

  return parts.join("").slice(0, targetChars);
}

function makeSections(seed, sectionCount, charsPerSection) {
  return Array.from({ length: sectionCount }, (_, index) => {
    const sectionSeed = `${seed}:section:${index}`;
    const text = makeChunk(sectionSeed, index, charsPerSection);
    return {
      id: `${sectionSeed}:${text.length}`,
      heading: `Section ${index + 1}`,
      text,
      digest: crypto.createHash("md5").update(text).digest("hex"),
    };
  });
}

export function buildSyntheticPayload(key, options = {}) {
  const targetKb = Math.max(64, Math.min(1024, toPositiveInt(options.kb, 256)));
  const sectionCount = Math.max(12, Math.min(128, toPositiveInt(options.sections, 32)));
  const charsPerSection = Math.ceil((targetKb * 1024) / sectionCount);
  const seed = `${key}:${targetKb}:${sectionCount}`;
  const sections = makeSections(seed, sectionCount, charsPerSection);
  const summary = sections.map((section) => section.digest).join(",");

  return {
    key,
    targetKb,
    sectionCount,
    generatedAt: new Date().toISOString(),
    digest: crypto.createHash("sha1").update(summary).digest("hex"),
    sections,
    sidebar: sections.slice(0, 8).map((section) => ({
      id: section.id,
      heading: section.heading,
      preview: section.text.slice(0, 160),
    })),
  };
}

function getOrigin() {
  const origin = process.env.REPRO_ORIGIN ?? "";

  if (!origin) {
    throw new Error("Missing REPRO_ORIGIN for internal payload fetches.");
  }

  return origin.replace(/\/$/, "");
}

export async function getSyntheticPayload(key, options = {}) {
  "use cache";

  const searchParams = new URLSearchParams({
    kb: String(options.kb ?? 256),
    sections: String(options.sections ?? 32),
  });
  const response = await fetch(
    `${getOrigin()}/api/source/${encodeURIComponent(key)}?${searchParams.toString()}`,
    {
      cache: "force-cache",
      next: {
        revalidate: 3600,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`payload_fetch_failed:${response.status}`);
  }

  return response.json();
}
