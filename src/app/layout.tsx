import type { Metadata } from "next";
import { Bot, LayoutDashboard, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Providers } from "./providers";
import "./globals.css"

export const metadata: Metadata = {
  title: "AI Tier-2 Incident Response",
  description: "AI agent for SaaS incident investigation and remediation",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="min-h-screen">
            <header className="border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]">
              <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                <Link href="/dashboard" className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-orange-200 bg-orange-100">
                    <Bot className="h-6 w-6 text-orange-700" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">AI Tier-2 Support</p>
                    <p className="text-xs font-semibold text-slate-600">Incident Response Agent</p>
                  </div>
                </Link>
                <nav className="flex items-center gap-3 text-sm">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center rounded-lg border border-blue-200 bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-800 transition hover:bg-blue-200"
                  >
                    <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                  </Link>
                  <Link
                    href="/incidents"
                    className="inline-flex items-center justify-center rounded-lg border border-blue-200 bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-800 transition hover:bg-blue-200"
                  >
                    <AlertTriangle className="mr-2 h-4 w-4" /> Incidents
                  </Link>
                </nav>
              </div>
            </header>
            <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}