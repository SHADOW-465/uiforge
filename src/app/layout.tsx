import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { StackPanel } from "@/components/stack/StackPanel";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  title: "UIForge - AI Pattern Selector & Prompt Composer",
  description: "Browse modern UI patterns, assemble architecture stacks, and generate structured prompts for AI agents.",
};

import { getCategories } from "@/lib/actions";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const categories = await getCategories();

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${geistSans.className} min-h-screen bg-background text-foreground antialiased selection:bg-primary/30`} suppressHydrationWarning>
        <Navbar />
        <div className="container flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10 border-x border-border/40 max-w-screen-2xl mx-auto h-[calc(100vh-3.5rem)] overflow-hidden">
          {/* Left Sidebar - scrollable independently */}
          <aside className="fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 md:sticky md:block overflow-y-auto border-r border-border/40">
            <Sidebar categories={categories} />
          </aside>

          <main className="relative h-full overflow-hidden flex flex-col lg:flex-row">
            {/* Middle Container - Main content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
              {children}
            </div>

            {/* Right Sidebar - Stack Panel */}
            <div className="hidden lg:block w-[360px] flex-shrink-0 border-l border-border/40 h-full overflow-hidden bg-muted/10">
              <StackPanel />
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
