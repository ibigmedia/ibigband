import type { Metadata } from "next";
import { Inter, Nanum_Pen_Script } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import { AuthProvider } from "@/lib/firebase/auth";
import GlobalMusicPlayer from "@/components/music/GlobalMusicPlayer";



const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const nanumPen = Nanum_Pen_Script({
  weight: "400",
  variable: "--font-nanum-pen",
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
      <body className={`${inter.variable} ${nanumPen.variable} antialiased font-sans bg-[#FAF9F6] text-[#2D2926] flex flex-col`}>
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

