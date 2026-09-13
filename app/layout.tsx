import type { Metadata } from "next";
import "./globals.css";

import Navbar from "@/components/Navbar";
import Footer from "@/components/footer";

export const metadata: Metadata = {
  title: "iSports",
  description: "Your world of sports",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col antialiased">
        <Navbar />

        <main className="flex-1">
          {children}
        </main>

        <Footer />
      </body>
    </html>
  );
}