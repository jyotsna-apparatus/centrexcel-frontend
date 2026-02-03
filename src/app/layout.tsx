import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { PWARegister } from "@/components/pwa-register";
import { Providers } from "@/components/providers";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Centrexcel",
  description: "Centrexcel - Progressive Web App",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Centrexcel",
  },
  themeColor: "#000000",
  icons: {
    icon: "/icon",
    apple: "/icon",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} antialiased`}
      >
        <Providers>
          <PWARegister />
          <div className='pattern' />
          <div className='relative z-2'>
            {children}
          </div>
        </Providers>

      </body>
    </html>
  );
}
