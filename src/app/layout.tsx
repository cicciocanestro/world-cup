import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mondiali 2026 - Risultati Live, Classifiche e Risultati",
  description: "Segui i Mondiali FIFA 2026 in tempo reale. Risultati live, risultate partite, marcatori, classifiche gironi e prossime partite. USA, Canada, Messico.",
  keywords: ["Mondiali 2026", "FIFA", "risultati live", "classifiche", "risultati", "calcio"],
};

export const viewport: Viewport = {
  themeColor: "#111827",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="it"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-950 text-gray-100">
        <Header />
        <div className="flex-1">{children}</div>
        <footer className="bg-gray-900 border-t border-gray-800 py-6 mt-12">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-gray-500 text-xs">
              Dati forniti da ESPN API. Non affiliato con FIFA o ESPN.
            </p>
            <p className="text-gray-600 text-xs mt-1">
              Mondiali 2026 · USA · Canada · Messico
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
