import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BuyZone",
  description: "Calm buy zone intelligence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}