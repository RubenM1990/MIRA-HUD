import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MIRA-HUD",
  description: "The MIRA HUD only (MIT): violet AI-agent interface with a living field, orbiting light lines and a particle core. The MIRA Humanoid is not included.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500&family=Share+Tech+Mono&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
