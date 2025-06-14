import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Background Remover – Free Online Image Background Removal Tool",
  description:
    "Remove image backgrounds instantly and for free with our AI-powered background remover. Upload, process, and download transparent images in seconds. No signup required!",
  keywords: [
    "background remover",
    "remove background",
    "AI background remover",
    "free background removal",
    "image background remover",
    "transparent background",
    "online tool",
  ],
  openGraph: {
    title: "AI Background Remover – Free Online Image Background Removal Tool",
    description:
      "Remove image backgrounds instantly and for free with our AI-powered background remover. Upload, process, and download transparent images in seconds. No signup required!",
    url: "https://yourdomain.com/",
    siteName: "AI Background Remover",
    images: [
      {
        url: "/public/file.svg",
        width: 1200,
        height: 630,
        alt: "AI Background Remover Screenshot",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Background Remover – Free Online Image Background Removal Tool",
    description:
      "Remove image backgrounds instantly and for free with our AI-powered background remover. Upload, process, and download transparent images in seconds. No signup required!",
    images: ["/public/file.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Google Analytics gtag.js */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-HCH31MEB5R"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-HCH31MEB5R');
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
