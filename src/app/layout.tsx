import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Feelora — Spatial Music Universe",
  description:
    "Step inside your music. Every song becomes a star in your personal spatial universe. Connect Spotify and explore your music collection in immersive 3D.",
  keywords: [
    "spatial music",
    "3D music player",
    "Spotify",
    "immersive",
    "music universe",
    "WebGL",
  ],
  openGraph: {
    title: "Feelora — Spatial Music Universe",
    description:
      "Step inside your music. Every song becomes a star in your personal spatial universe.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#000000" />
        <meta name="color-scheme" content="dark" />
      </head>
      <body className="min-h-full bg-black text-white font-sans overflow-hidden" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
