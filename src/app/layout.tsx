import type { Metadata } from "next";
import { DM_Sans, DM_Serif_Display } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { QueryProvider } from "@/lib/providers/QueryProvider";
import { Toaster } from "sonner";
import "../bones/registry";

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
  title: "Healio.AI - Pain Management Assistant",
  description: "A clinical-grade assistant to help you understand your symptoms safely.",
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
      </body>
    </html>
  );
}

