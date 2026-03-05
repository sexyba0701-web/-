import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Monster Fit MVP",
  description: "モンスター育成 × 筋トレ × 食事習慣",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
