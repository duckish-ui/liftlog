import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import Nav from "@/components/Nav";
import { getSession } from "@/lib/auth";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Liftlog", template: "%s · Liftlog" },
  description: "A simple gym workout tracker: log sets, track PRs, and see your progress.",
};

export const viewport: Viewport = { themeColor: "#0b0b0f" };

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession();
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-screen antialiased`}>
        <Providers>
          <Nav userName={session?.name ?? null} />
          <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-6 sm:pb-12">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
