import type { Metadata } from "next";
import { DM_Sans, DM_Serif_Display } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { QueryProvider } from "@/lib/providers/QueryProvider";
import { Toaster } from "sonner";
import "../bones/registry";
import { Analytics } from "@vercel/analytics/next";

const siteUrl = new URL("https://healio-ai.vercel.app");

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["400", "500", "600", "700"],
});

const dmSerifDisplay = DM_Serif_Display({
  subsets: ["latin"],
  variable: "--font-dm-serif",
  weight: "400",
});

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: "Healio - Your Family Health Guide",
    template: "%s | Healio",
  },
  description: "Simple, honest wellness guidance for Indian families in their language, with Ayurvedic home care, homeopathic context, source-led scoring, and clear doctor escalation signals.",
  keywords: [
    "Healio",
    "Indian family health guide",
    "Ayurvedic home remedies",
    "homeopathic context",
    "wellness guidance India",
    "DPDP health privacy",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Healio - Your Family Health Guide",
    description: "Language-first wellness guidance for Indian families, with safe home-care context and clear doctor escalation signals.",
    locale: "en_IN",
    siteName: "Healio",
    type: "website",
    url: "/",
  },
  twitter: {
    card: "summary",
    title: "Healio - Your Family Health Guide",
    description: "Simple, honest wellness guidance for Indian families in their language.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head />
      <body
        className={`${dmSans.variable} ${dmSerifDisplay.variable} font-sans min-h-screen bg-background antialiased`}
        style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
        suppressHydrationWarning={true}
      >
        <QueryProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </QueryProvider>
        <Toaster
          richColors
          position="bottom-right"
          toastOptions={{
            className: 'font-sans',
          }}
        />
        <Analytics />
      </body>
    </html>
  );
}
