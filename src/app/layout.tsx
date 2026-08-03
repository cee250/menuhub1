import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

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
    <html lang="en">
      <body className="font-sans antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}