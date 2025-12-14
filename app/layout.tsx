import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Script from "next/script";
import "./globals.css";
import { Providers } from "./providers";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "PostMetric | Find out which marketing channels drive your revenue",
  description:
    "Track what drives revenue, not vanity metrics. See which channels bring paying customers.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" style={{ height: "auto", minHeight: "100%" }}>
      <body
        className={`${dmSans.variable} font-sans bg-background`}
        style={{ height: "auto", minHeight: "100%" }}
      >
        <Providers>{children}</Providers>
        <SpeedInsights />
        <Script
          defer
          data-website-id="pmid_fdf703b82d846f2109a76457"
          data-domain="postmetric.io"
          src="https://www.postmetric.io/js/script.js"
          strategy="afterInteractive"
        />
        <script
          defer
          data-website-id="dfid_YuvP5zpTg5hNE8YeNLGbh"
          data-domain="uxmagic.ai"
          data-allow-localhost="true"
          src="https://datafa.st/js/script.js"
        ></script>
      </body>
    </html>
  );
}
