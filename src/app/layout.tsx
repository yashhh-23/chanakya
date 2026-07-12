import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TransitOps Enterprise",
  description: "Fleet, driver, and dispatch operations dashboard",
};

import { ClientProviders } from "@/components/providers/ClientProviders";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full">
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
