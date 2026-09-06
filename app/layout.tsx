import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MorphUI - Dynamic Spatial Canvas System",
  description: "0% hardcoded dynamic spatial canvas system powered by real-time Google Search grounding and Gemini 2.5 Flash.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="w-screen h-screen overflow-hidden bg-[#070b14] text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
