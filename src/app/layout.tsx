import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import { AuthProvider } from "@/lib/firebase/auth";
import GlobalMusicPlayer from "@/components/music/GlobalMusicPlayer";



const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ibiGband",
  description: "Contemporary Warmth Archive for CCM and Artists",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="bg-[#2D2926]">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Nanum+Pen+Script&display=swap" rel="stylesheet" />
      </head>
      <body className={`${inter.variable} antialiased font-sans bg-[#FAF9F6] text-[#2D2926] flex flex-col`}>
        <AuthProvider>
          <Navigation />
          <main className="pt-20 flex flex-col bg-[#FAF9F6]">
            {children}
          </main>
          <GlobalMusicPlayer />
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}

