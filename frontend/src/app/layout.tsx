import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DataDrop API Explorer",
  description: "Explore the DataDrop market cap API",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistSans.className} h-full antialiased`.trim()}
      style={{ colorScheme: "dark" }}
    >
      <body className="min-h-full bg-background text-foreground font-sans">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 px-6 py-8 md:px-10 md:py-10 max-w-5xl">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
