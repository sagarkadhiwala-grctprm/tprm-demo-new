import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

export const metadata: Metadata = {
  title: {
    default: "VendorSight — AI-Powered Third-Party Risk Intelligence",
    template: "%s | VendorSight",
  },
  description:
    "Automate third-party vendor risk assessment with AI. Replace manual KY3P workflows with intelligent risk scoring, dynamic questionnaires, and AI-generated executive reports.",
  keywords: [
    "TPRM",
    "vendor risk",
    "third party risk",
    "risk assessment",
    "AI",
    "GRC",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${dmSans.variable} ${fraunces.variable} font-sans antialiased bg-navy text-[#F9FAFB] min-h-screen flex flex-col`}
      >
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
