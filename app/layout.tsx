import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import Script from "next/script";
import "./globals.css";

import AssistantWidget from "./components/AssistantWidget";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Crazy Cakes",
  description: "Welcome to Crazy Cakes - Cakes & Pastries",
  icons: {
    icon: [{ url: "/cakelogo.png", sizes: "32x32", type: "image/png" }],
    apple: [{ url: "/cakelogo.png", sizes: "180x180" }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Google Analytics */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
          strategy="afterInteractive"
        />
        <Script strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
          `}
        </Script>
      </head>

      <body className={`${outfit.className} antialiased`}>
        {children}

        {/* Floating AI assistant widget - bottom left */}
        <AssistantWidget />
      </body>
    </html>
  );
}
