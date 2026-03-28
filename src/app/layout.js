export const metadata = {
  title: "PSXClaw — KSE-100 AI Analyst",
  description: "AI-powered Pakistan Stock Exchange analysis tool",
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
