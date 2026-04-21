import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Day Adventure Planner",
  description: "AI-powered itinerary builder for unforgettable day adventures",
  openGraph: {
    title: "Day Adventure Planner",
    description: "Turn your preferences into a perfect day out — restaurants, galleries, bars, and more.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased bg-stone-50 text-stone-900`}>
        {children}
      </body>
    </html>
  );
}
