import type { Metadata } from "next";
import { Inter, Nanum_Pen_Script } from "next/font/google";
import Script from "next/script";
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
  preload: false,
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
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}');
          `}
        </Script>
      </head>
      <body className={`${inter.variable} ${nanumPen.variable} antialiased font-sans bg-[#FAF9F6] text-[#2D2926] flex flex-col`}>
        <AuthProvider>
          <Navigation />
          <main className="pt-17 md:pt-20 flex flex-col bg-[#FAF9F6]">
            {children}
          </main>
          <GlobalMusicPlayer />
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}

