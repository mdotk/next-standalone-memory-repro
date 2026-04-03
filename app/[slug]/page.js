import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { getSyntheticPayload } from "../../lib/payload";

export default async function SlugPage({ params, searchParams }) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <SlugPageBody params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function SlugPageBody({ params, searchParams }) {
  await connection();
  const { slug } = await params;
  const query = await searchParams;
  const variant = typeof query.variant === "string" ? query.variant : "0";
  const kb = typeof query.kb === "string" ? query.kb : "256";
  const payload = await getSyntheticPayload(`${slug}:${variant}`, { kb, sections: 36 });

  return (
    <main style={{ maxWidth: 980, margin: "0 auto", padding: "40px 24px 96px" }}>
      <header style={{ marginBottom: 28 }}>
        <p style={{ margin: 0, opacity: 0.7 }}>
          <Link href="/">Home</Link>
        </p>
        <h1 style={{ fontSize: 36, lineHeight: 1.1, marginBottom: 12 }}>
          Synthetic page for {slug}
        </h1>
        <p style={{ maxWidth: 760, lineHeight: 1.7 }}>
          This route is intentionally server-rendered from a cached helper and
          produces many unique response bodies under changing slugs and variants.
        </p>
        <dl
          style={{
            display: "grid",
            gridTemplateColumns: "max-content 1fr",
            gap: "8px 16px",
            marginTop: 20,
          }}
        >
          <dt>variant</dt>
          <dd>{variant}</dd>
          <dt>target kb</dt>
          <dd>{payload.targetKb}</dd>
          <dt>sections</dt>
          <dd>{payload.sectionCount}</dd>
          <dt>digest</dt>
          <dd style={{ wordBreak: "break-all" }}>{payload.digest}</dd>
        </dl>
      </header>

      <aside
        style={{
          padding: 20,
          background: "#ebe7df",
          borderRadius: 16,
          marginBottom: 28,
        }}
      >
        <strong>Sidebar preview</strong>
        <ul style={{ lineHeight: 1.7 }}>
          {payload.sidebar.map((item) => (
            <li key={item.id}>
              <strong>{item.heading}</strong>: {item.preview}
            </li>
          ))}
        </ul>
      </aside>

      <section style={{ display: "grid", gap: 18 }}>
        {payload.sections.map((section) => (
          <article
            key={section.id}
            style={{
              padding: 18,
              borderRadius: 16,
              background: "#ffffff",
              boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
            }}
          >
            <h2 style={{ marginTop: 0 }}>{section.heading}</h2>
            <p style={{ lineHeight: 1.75, marginBottom: 12 }}>{section.text}</p>
            <code style={{ opacity: 0.8 }}>{section.digest}</code>
          </article>
        ))}
      </section>
    </main>
  );
}

function PageSkeleton() {
  return (
    <main style={{ maxWidth: 980, margin: "0 auto", padding: "40px 24px 96px" }}>
      <p style={{ opacity: 0.7 }}>Loading synthetic payload…</p>
    </main>
  );
}
