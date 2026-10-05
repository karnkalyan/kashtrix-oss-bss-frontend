// app/layout.tsx
import type React from "react";
import type { Metadata } from "next";
import "@/app/globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AnimatedToaster } from "@/components/animated-toaster";
import { WebSocketProvider } from "@/contexts/WebSocketContext";
import { BranchProvider } from "@/contexts/BranchContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { LicenseExpiredModal } from "@/components/license-expired-modal";
import { CalendarSystemProvider } from "@/contexts/CalendarSystemContext";

export const metadata: Metadata = {
  title: { default: "Kashtrix", template: "%s | Kashtrix" },
  description: "AI-native telecom OSS/BSS and automation platform",
  applicationName: "Kashtrix",
  icons: {
    icon: "/kashtrix-logo/icons-logo.png",
    apple: "/kashtrix-logo/icons-logo.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* 
          Use a regular <script> tag via dangerouslySetInnerHTML instead of next/script.
          next/script with beforeInteractive inside <head> in the app router
          can cause SSR issues. A raw inline script is safe because it only
          runs in the browser when the HTML is parsed.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme') || 'dark';
                  if (!theme) {
                    theme = 'dark';
                    localStorage.setItem('theme', theme);
                  }

                  var root = document.documentElement;
                  if (theme === 'dark') {
                    root.classList.add('dark');
                    root.style.colorScheme = 'dark';
                    root.style.setProperty('--theme-bg', '#09050F');
                    root.style.setProperty('--theme-text', '#FFFFFF');
                    root.style.setProperty('--theme-card', '#1A0D24');
                    root.style.setProperty('--theme-card-foreground', '#FFFFFF');
                    root.style.setProperty('--theme-border', '#342044');
                    root.style.setProperty('--theme-muted', '#2B0D3A');
                    root.style.setProperty('--theme-muted-foreground', '#B8A8C2');
                  } else {
                    root.classList.remove('dark');
                    root.style.colorScheme = 'light';
                    root.style.setProperty('--theme-bg', '#F8F7FA');
                    root.style.setProperty('--theme-text', '#1B1024');
                    root.style.setProperty('--theme-card', '#ffffff');
                    root.style.setProperty('--theme-card-foreground', '#1B1024');
                    root.style.setProperty('--theme-border', '#E8DFF0');
                    root.style.setProperty('--theme-muted', '#F4EEFF');
                    root.style.setProperty('--theme-muted-foreground', '#6F6078');
                  }
                } catch (e) {
                  console.error('Theme detection failed:', e);
                }
              })();
            `,
          }}
        />
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <AuthProvider>
            <CalendarSystemProvider>
            <WebSocketProvider>
              <BranchProvider>
                {children}
              </BranchProvider>
              <LicenseExpiredModal />
              <AnimatedToaster />
            </WebSocketProvider>
            </CalendarSystemProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
