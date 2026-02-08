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
    icon: "/logo-mark.svg",
    apple: "/logo-mark.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${poppins.variable} antialiased`}
      >
        <Providers>
          <PWARegister />
          <div className='pattern' aria-hidden />
          <div className="relative z-2">
            {/* <SiteHeader /> */}
            {children}
            {/* <Footer /> */}
          </div>
        </Providers>

      </body>
    </html>
  );
}
