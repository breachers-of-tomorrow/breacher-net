import type { Metadata } from "next";
import { Share_Tech_Mono, Orbitron } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/Navigation";

const shareTechMono = Share_Tech_Mono({
  weight: "400",
  variable: "--font-share-tech-mono",
  subsets: ["latin"],
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
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
        className={`${shareTechMono.variable} ${orbitron.variable} antialiased`}
      >
        <Navigation />
        {children}
      </body>
    </html>
  );
}
