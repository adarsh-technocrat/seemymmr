import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
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
      </body>
    </html>
  );
}
