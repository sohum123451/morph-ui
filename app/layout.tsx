import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MorphUI - Intelligent Product & Entity Comparison Engine",
  description: "Production-grade side-by-side entity and product comparison with real-time web retrieval and verified specifications.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-slate-800 selection:text-white">
        {children}
      </body>
    </html>
  );
}
