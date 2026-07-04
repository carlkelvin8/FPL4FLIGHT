import type { Metadata } from "next";

import Providers from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    template: "%s | PilotForms™ Admin",
    default: "PilotForms™ Admin",
  },
  description: "PilotForms™ Admin Dashboard — Manage pilots, forms, and subscriptions.",
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
