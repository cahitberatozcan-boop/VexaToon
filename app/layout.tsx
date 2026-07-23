import type { Metadata } from "next";
import Navbar from "./components/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Suzurin",
  description: "Suzurin Anime, Manga ve Manhwa",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className="min-h-screen text-white">
        <Navbar />

        <main className="pt-[88px]">
          {children}
        </main>
      </body>
    </html>
  );
}