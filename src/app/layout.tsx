import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Sidebar } from "@/components/layout/Sidebar";
import { auth } from "@/auth";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta" });

export const metadata: Metadata = {
  title: "LogMind",
  description: "Work logging and reporting platform",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en">
      <body className={`${inter.variable} ${jakarta.variable} flex h-screen overflow-hidden bg-background font-sans antialiased`}>
        <Providers>
          {session && <Sidebar />}
          <div className="flex flex-1 flex-col overflow-hidden relative">
            {/* Subtle Global Background Gradient */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-background via-background to-secondary/20 pointer-events-none z-[-1]" />
            
            <main className="flex-1 overflow-y-auto overflow-x-hidden">
               {children}
            </main>
          </div>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
