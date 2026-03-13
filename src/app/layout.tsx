import type { Metadata } from "next";
import { Gaegu, Inter } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import { AuthProvider } from "@/lib/firebase/auth";

const gaegu = Gaegu({
  variable: "--font-gaegu",
  weight: ["300", "400", "700"],
  subsets: ["latin"],
  preload: false,
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ibigband",
  description: "Contemporary Warmth Archive for CCM and Artists",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${gaegu.variable} ${inter.variable} antialiased font-sans bg-[#FAF9F6] text-[#2D2926]`}>
        <AuthProvider>
          <Navigation />
          <main className="pt-20">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}

