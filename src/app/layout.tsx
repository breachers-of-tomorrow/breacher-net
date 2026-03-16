import type { Metadata } from "next";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/Navigation";
import { SITE_URL } from "@/lib/urls";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "BREACHER.NET // Breachers of Tomorrow",
    template: "%s // BREACHER.NET",
  },
  description:
    "Community tracker and hub for the Marathon ARG — Breachers of Tomorrow",
  keywords: ["marathon", "arg", "bungie", "cryoarchive", "breach protocol"],
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "BREACHER.NET",
    title: "BREACHER.NET // Breachers of Tomorrow",
    description:
      "Community tracker and hub for the Marathon ARG — live kill count, sector states, stabilization data, and interactive maps.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "BREACH//NET — Community hub for the Marathon ARG",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BREACHER.NET // Breachers of Tomorrow",
    description:
      "Community tracker and hub for the Marathon ARG — live kill count, sector states, stabilization data, and interactive maps.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: SITE_URL,
  },
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
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-accent focus:text-background focus:text-sm focus:font-bold focus:tracking-widest focus:outline-none"
        >
          Skip to content
        </a>
        <Navigation />
        <div id="main-content">
          {children}
        </div>
      </body>
    </html>
  );
}
