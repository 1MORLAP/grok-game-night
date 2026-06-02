import type { Metadata } from "next";
import { Geist, Geist_Mono, Anton, Permanent_Marker, Caveat } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

// Image-matching web fonts for the visual direction
const poster = Anton({
  variable: "--font-poster",
  subsets: ["latin"],
  weight: "400",
});

const brush = Permanent_Marker({
  variable: "--font-brush",
  subsets: ["latin"],
  weight: "400",
});

const chalk = Caveat({
  variable: "--font-chalk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Game Night • June 6, 2026",
  description: "Paraiso Bay & Gran Paraiso Wellness Group — 5-9 PM at the Bowling Area. Bowling • Pool • Ping Pong • Foosball • Dominoes. 5 rounds, 25 min each.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${poster.variable} ${brush.variable} ${chalk.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#111] text-[#f5f5f0]">
        {children}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
