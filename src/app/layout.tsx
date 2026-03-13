import type { Metadata } from "next";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/Navigation";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "BREACHER.NET // Breachers of Tomorrow",
    template: "%s // BREACHER.NET",
  },
  description:
    "Community tracker and hub for the Marathon ARG — Breachers of Tomorrow",
  keywords: ["marathon", "arg", "bungie", "cryoarchive", "breach protocol"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${jetbrainsMono.variable} ${spaceGrotesk.variable} antialiased`}
      >
        <Navigation />
        {children}
      </body>
    </html>
  );
}
