export const metadata = {
  title: "Next Standalone Memory Repro",
  description: "Minimal repro for standalone + Cache Components memory growth",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          background: "#f6f6f1",
          color: "#161616",
        }}
      >
        {children}
      </body>
    </html>
  );
}
