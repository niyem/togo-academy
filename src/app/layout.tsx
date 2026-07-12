import type { Metadata } from "next";
import { Geist, Newsreader } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ChatWidget } from "@/components/chat/ChatWidget";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Police editoriale pour les grands titres (style "journal", graisse 400).
const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal"],
});

export const metadata: Metadata = {
  title: {
    default: "Togo Academy — Réussir grâce à des cours clairs",
    template: "%s · Togo Academy",
  },
  description:
    "Plateforme d'apprentissage en ligne pour les élèves du Togo : cours vidéo, exercices, quiz et tuteur IA, du primaire au lycée.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${newsreader.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        {/* Active une fois ANTHROPIC_API_KEY credite (voir .env.example). */}
        {process.env.NEXT_PUBLIC_CHAT_ENABLED === "1" && <ChatWidget />}
      </body>
    </html>
  );
}
