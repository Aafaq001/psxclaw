export const metadata = {
  title: "PSXClaw — KSE-100 Senior AI Analyst",
  description: "Institutional-grade AI-powered Pakistan Stock Exchange analysis tool. Get the highest quality technical and fundamental stock analytics tailored for the PSX.",
  keywords: ["PSX", "Pakistan Stock Exchange", "KSE-100", "Stock Market Analyst", "Trading", "AI Analyst", "Investment", "Finance"],
  openGraph: {
    title: "PSXClaw — KSE-100 Senior AI Analyst",
    description: "Institutional-grade AI-powered Pakistan Stock Exchange analysis tool.",
    type: "website",
    locale: "en_PK",
    siteName: "PSXClaw",
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning style={{ margin: 0, padding: 0, background: "#EEE9E0" }}>
        {children}
      </body>
    </html>
  );
}
