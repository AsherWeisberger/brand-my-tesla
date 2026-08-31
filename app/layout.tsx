import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Brand My Tesla — Robert Scoble",
  description:
    "Live auction: 11 vinyl sticker spots on Robert Scoble's white 2018 Tesla Model 3. Your logo rides with him.",
  authors: [{ name: "Asher Weisberger", url: "https://x.com/AsherWeisberger" }],
  creator: "@AsherWeisberger",
  openGraph: {
    title: "Brand My Tesla",
    description: "Your brand, on Robert Scoble's white 2018 Model 3.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    creator: "@AsherWeisberger",
    title: "Brand My Tesla",
    description: "Your brand, on Robert Scoble's white 2018 Model 3.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;650;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
