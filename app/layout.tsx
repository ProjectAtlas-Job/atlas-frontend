import type { Metadata } from "next";
import "./globals.css";

import { AuthNavigationBridge } from "@/components/providers/AuthNavigationBridge";

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
        <AuthNavigationBridge />
        {children}
      </body>
    </html>
  );
}
