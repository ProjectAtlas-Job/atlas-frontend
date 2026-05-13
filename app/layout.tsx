import type { Metadata } from "next";
import "./globals.css";

import { AuthNavigationBridge } from "@/components/providers/AuthNavigationBridge";
import { AppQueryProvider } from "@/components/providers/QueryProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";

export const metadata: Metadata = {
  title: "Project Atlas",
  description: "Auth and dashboard frontend for Project Atlas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <AppQueryProvider>
          <ToastProvider>
            <AuthNavigationBridge />
            {children}
          </ToastProvider>
        </AppQueryProvider>
      </body>
    </html>
  );
}
