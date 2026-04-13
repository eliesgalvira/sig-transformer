import type { Metadata } from 'next';
import Script from 'next/script';
import { Analytics } from '@vercel/analytics/react';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { SignalProvider } from '@/contexts/signal-context';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const ICON_ASSET_VERSION = '4';

export const metadata: Metadata = {
  title: 'Signal Transformer Tool',
  description: 'Generate signals and observe their DFT (Discrete Fourier Transform)',
  manifest: `/manifest.webmanifest?v=${ICON_ASSET_VERSION}`,
  icons: {
    icon: [
      { url: `/favicon.svg?v=${ICON_ASSET_VERSION}`, type: 'image/svg+xml' },
      { url: `/favicon.ico?v=${ICON_ASSET_VERSION}`, type: 'image/x-icon' },
    ],
    apple: `/favicon-512.png?v=${ICON_ASSET_VERSION}`,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" data-workbench-theme="dark" suppressHydrationWarning>
      <head>
        <Script id="workbench-theme-init" strategy="beforeInteractive">
          {`
            (function () {
              try {
                var storedTheme = window.localStorage.getItem('workbench-theme');
                var theme = storedTheme === 'cream' ? 'cream' : 'dark';
                document.documentElement.classList.toggle('dark', theme === 'dark');
                document.documentElement.dataset.workbenchTheme = theme;
              } catch (error) {
                document.documentElement.classList.add('dark');
                document.documentElement.dataset.workbenchTheme = 'dark';
              }
            })();
          `}
        </Script>
        <Script id="mathjax-config" strategy="beforeInteractive">
          {`
            window.MathJax = {
              tex: {
                inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
                displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']],
                processEscapes: true
              },
              svg: {
                fontCache: 'global'
              },
              startup: {
                typeset: false
              },
              chtml: {
                scale: 1,
                matchFontHeight: false,
                mtextFont: "inherit"
              }
            };
          `}
        </Script>
        <Script
          src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"
          strategy="afterInteractive"
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SignalProvider>
          {children}
        </SignalProvider>
        <Analytics />
      </body>
    </html>
  );
}
