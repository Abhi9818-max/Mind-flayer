import type { Metadata } from "next";
import "./globals.css";
import { UIProvider } from "@/lib/context/UIContext";

export const metadata: Metadata = {
  title: "Mind-Flayer | Your Campus, Unfiltered",
  description: "The anonymous social platform for college students. Share confessions, rumors, and crushes within your verified college bubble.",
  keywords: ["anonymous", "college", "social", "confessions", "rumors", "crush", "ncr", "delhi"],
  authors: [{ name: "Mind-Flayer" }],
  manifest: "/manifest.json",
  themeColor: "#ef4444",
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
          {children}
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
            `,
          }}
        />
      </body>
    </html>
  );
}
