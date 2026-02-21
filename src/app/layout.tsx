import type { Metadata } from "next";
import "./globals.css";
import { UIProvider } from "@/lib/context/UIContext";
import { ToastProvider } from "@/lib/context/ToastContext";
import { ToastContainer } from "@/components/ui/ToastContainer";
import { AccountStatusBanner } from "@/components/layout/AccountStatusBanner";
import { AdaptiveUIDebug } from "@/components/debug/AdaptiveUIDebug";

export const viewport = {
  themeColor: "#ef4444",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Mind-Flayer | Your Campus, Unfiltered",
  description: "The anonymous social platform for college students. Share confessions, rumors, and crushes within your verified college bubble.",
  keywords: ["anonymous", "college", "social", "confessions", "rumors", "crush", "ncr", "delhi"],
  authors: [{ name: "Mind-Flayer" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Mind-Flayer",
  },
  openGraph: {
    title: "Mind-Flayer",
    description: "Your campus, unfiltered. Anonymous social for college students.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <UIProvider>
          <ToastProvider>
            <AccountStatusBanner />
            {children}
            <ToastContainer />
            <AdaptiveUIDebug />
          </ToastProvider>
        </UIProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js')
                    .then(registration => {
                      console.log('[SW] Registered:', registration);
                    })
                    .catch(error => {
                      console.error('[SW] Registration failed:', error);
                    });
                });
              }

              // Suppress known Next.js Turbopack AbortError overlay
              const originalError = console.error;
              console.error = function(...args) {
                if (args[0] && typeof args[0] === 'string' && args[0].includes('signal is aborted without reason')) {
                  return;
                }
                if (args[0] && args[0].name === 'AbortError') return;
                originalError.apply(console, args);
              };

              window.addEventListener('unhandledrejection', event => {
                if (event.reason && (event.reason.name === 'AbortError' || event.reason.message.includes('signal is aborted'))) {
                  event.preventDefault();
                }
              });
            `,
          }}
        />
      </body>
    </html>
  );
}
