const steps = [
  "Run `npm install`.",
  "Run `npm run build`.",
  "Start the standalone server with `npm run start:standalone`.",
  "Watch memory at `/api/health`.",
  "Generate unique traffic with `BASE_URL=http://127.0.0.1:3000 npm run load`.",
];

export default function HomePage() {
  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px 96px" }}>
      <h1 style={{ fontSize: 40, lineHeight: 1.1, marginBottom: 16 }}>
        Next.js standalone memory repro
      </h1>
      <p style={{ fontSize: 18, lineHeight: 1.6, maxWidth: 720 }}>
        This app is intentionally small. It exercises a cached dynamic page and a
        cached API route under high-cardinality traffic while exposing process
        memory through a health endpoint.
      </p>
      <ol style={{ fontSize: 16, lineHeight: 1.8, paddingLeft: 20 }}>
        {steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <p style={{ marginTop: 32, fontSize: 15, lineHeight: 1.7 }}>
        Useful endpoints:
      </p>
      <ul style={{ fontSize: 15, lineHeight: 1.8 }}>
        <li>
          <code>/api/health</code>
        </li>
        <li>
          <code>/api/payload/example?variant=0&amp;kb=256</code>
        </li>
        <li>
          <code>/example?variant=0&amp;kb=256</code>
        </li>
      </ul>
    </main>
  );
}
