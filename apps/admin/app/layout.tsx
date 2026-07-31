import type { Metadata } from "next";

import Providers from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    template: "%s | FPL4FLIGHT Admin",
    default: "FPL4FLIGHT Admin",
  },
  description: "FPL4FLIGHT Admin Dashboard — Manage pilots, forms, and subscriptions.",
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
