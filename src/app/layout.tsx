import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers"; // 🚀 ADDED THIS LINE

// Import Plus Jakarta Sans - The ultimate mobile-first UI font
const jakarta = Plus_Jakarta_Sans({ 
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "MenuHub - Digital Menus for Modern Businesses",
  description: "Create stunning QR code menus for your restaurant, cafe, or hotel in minutes.",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  // This makes it look like a real app when added to the home screen on iPhone/Android
  manifest: "/manifest.json", 
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={jakarta.variable}>
      <body className="font-sans antialiased">
        {/* 🚀 THIS WRAPPER MAKES USESESSION() WORK EVERYWHERE AND STOPS THE REDIRECT LOOP */}
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}