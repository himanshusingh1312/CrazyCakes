import type { Metadata } from "next";
import { Outfit } from "next/font/google";
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
}
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.className} antialiased`}>
        {children}

        {/* Floating AI assistant widget - bottom left */}
        <AssistantWidget />
      </body>
    </html>
  );
}

