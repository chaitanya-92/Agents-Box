import type { Metadata } from "next";
import { Press_Start_2P, Space_Grotesk } from "next/font/google";
import type { ReactNode } from "react";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

const pixelFont = Press_Start_2P({
  variable: "--font-pixel",
  subsets: ["latin"],
  weight: "400"
});

const bodyFont = Space_Grotesk({
  variable: "--font-body",
  subsets: ["latin"]
});

export const metadata: Metadata = {
  title: "AgentVerse AI",
  description: "One Platform. Unlimited AI Agents.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${pixelFont.variable} ${bodyFont.variable} font-[var(--font-body)]`}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
