import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import { Providers } from "./providers";
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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://digital.xasecurity.ca"),
  title: {
    default: "XA Payroll Portal",
    template: "%s | XA Payroll Portal"
  },
  description: "Operations platform for XA Security",
  icons: {
    icon: "/favicon.png",
  },
  openGraph: {
    title: "XA Payroll",
    description: "Operations platform for XA Security",
    images: [
      {
        url: "/platform-public.png",
        width: 1200,
        height: 630,
        alt: "XA Payroll",
      },
    ],
    url: process.env.NEXT_PUBLIC_APP_URL || "https://digital.xasecurity.ca",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const SIDEBAR_COOKIE_NAME = 'sidebar_state';
                try {
                  const cookie = document.cookie
                    .split('; ')
                    .find(row => row.startsWith(SIDEBAR_COOKIE_NAME + '='));
                  if (cookie) {
                    const savedOpen = cookie.split('=')[1] === 'true';
                    // Apply the correct initial state BEFORE React renders
                    // by setting a data attribute that CSS uses
                    document.documentElement.setAttribute('data-sidebar-initial', savedOpen ? 'open' : 'collapsed');
                  } else {
                    // Default to open if no cookie
                    document.documentElement.setAttribute('data-sidebar-initial', 'open');
                  }
                } catch (e) {
                  // Silently fail - default to open
                  document.documentElement.setAttribute('data-sidebar-initial', 'open');
                }

                // Also pre-load nav section states from localStorage to prevent flash
                try {
                  const stored = localStorage.getItem('nav_open_sections');
                  if (stored) {
                    document.documentElement.setAttribute('data-nav-sections', stored);
                  }
                } catch (e) {
                  // Silently fail if localStorage is unavailable
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {children}
        </Providers>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
