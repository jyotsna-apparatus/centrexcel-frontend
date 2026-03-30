import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import { Providers } from "@/components/providers";
import { PWARegister } from "@/components/pwa-register";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

export const viewport: Viewport = {
  themeColor: "#000000",
};

export const metadata: Metadata = {
  title: "Centrexcel",
  description: "Centrexcel - Progressive Web App",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Centrexcel",
  },
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
      <body className={`${poppins.variable} antialiased`}>
        <Providers>
          <PWARegister />
          {/* <div className='pattern' aria-hidden /> */}
          {/* <div className="relative z-2"> */}
          {/* <SiteHeader /> */}
          {children}
          {/* <Footer /> */}
          {/* </div> */}
        </Providers>
      </body>
    </html>
  );
}
