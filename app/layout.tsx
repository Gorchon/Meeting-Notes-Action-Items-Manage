import type { Metadata } from "next";
import "./globals.css";
import { DarkModeProvider } from "@/components/DarkModeProvider";
import { Navigation } from "@/components/Navigation";

export const metadata: Metadata = {
  title: "AI Meeting Notes & Action Items Manager",
  description: "Manage meeting notes and generate AI-powered summaries, decisions, and action items",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-gray-50 dark:bg-gray-900 transition-colors">
        <DarkModeProvider>
          <Navigation />
          <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {children}
          </main>
        </DarkModeProvider>
      </body>
    </html>
  );
}
