import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { QueryProvider } from "@/lib/providers/QueryProvider";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

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
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Prevent FOIT (Flash of Incorrect Theme) by applying dark class
            before React hydrates. Reads localStorage first, falls back
            to system preference via prefers-color-scheme. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var d=document.documentElement;var t=localStorage.getItem('healio-theme');if(t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme:dark)').matches)){d.classList.add('dark')}else{d.classList.remove('dark')}}catch(e){}})();`,
          }}
        />
      </head>
      <body
        className={`${inter.className} min-h-screen bg-background antialiased`}
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

