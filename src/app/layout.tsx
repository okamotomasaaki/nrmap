import type { Metadata, Viewport } from "next";
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
  title: "Nightreign Map | ELDEN RING NIGHTREIGN 探索ツール",
  description: "『ELDEN RING NIGHTREIGN（エルデンリング ナイトレイン）』のマップ探索ツール。出現地点の選択、各拠点の絞り込みからマップパターン特定、およびボスの詳細情報と耐性テーブルの確認が可能です。",
  keywords: ["ELDEN RING", "NIGHTREIGN", "エルデンリング", "ナイトレイン", "マップ", "マップ探索", "夜の王", "ボスの弱点", "属性耐性"],
  authors: [{ name: "Nightreign Map Team" }],
  metadataBase: new URL("https://www.nightreignmap.com"),
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    nocache: true,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: "Nightreign Map | ELDEN RING NIGHTREIGN 探索ツール",
    description: "『ELDEN RING NIGHTREIGN（エルデンリング ナイトレイン）』のマップ探索ツール。出現地点の選択、各拠点の絞り込みからマップパターン特定、およびボスの詳細情報と耐性テーブルの確認が可能です。",
    url: "https://www.nightreignmap.com",
    siteName: "Nightreign Map",
    images: [
      {
        url: "/title.png",
        width: 1200,
        height: 630,
        alt: "Nightreign Map Logo",
      },
    ],
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nightreign Map | ELDEN RING NIGHTREIGN 探索ツール",
    description: "『ELDEN RING NIGHTREIGN（エルデンリング ナイトレイン）』のマップ探索ツール。出現地点の選択、各拠点の絞り込みからマップパターン特定、およびボスの詳細情報と耐性テーブルの確認が可能です。",
    images: ["/title.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({
  children,
}: RootLayoutProps) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <head>
        {/* Google Tag Manager */}
        {/* eslint-disable-next-line @next/next/next-script-for-ga */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-K2H88NJ6');`
          }}
        />
        {/* End Google Tag Manager */}
      </head>
      <body className="min-h-full flex flex-col bg-gray-950 text-gray-100 selection:bg-blue-500/30 selection:text-blue-200">
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-K2H88NJ6"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        {children}
      </body>
    </html>
  );
}
