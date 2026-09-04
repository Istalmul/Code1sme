import type { Metadata, Viewport } from "next";
import "./globals.css";
import { htmlAttributes, loadAppearance } from "@/lib/settings/appearance";

export const metadata: Metadata = {
  title: {
    default: "Piasowo",
    template: "%s · Piasowo",
  },
  description:
    "Piasowo is an AI workforce operating system: run growth missions, discover prospects, catch opportunity signals and approve AI-drafted outreach.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const appearance = await loadAppearance();

  return (
    <html lang="en" {...htmlAttributes(appearance)}>
      <body className="antialiased">
        <a
          href="#main"
          className="sr-only-focusable absolute left-4 top-4 z-50 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
