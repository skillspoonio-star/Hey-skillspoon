import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Poppins } from 'next/font/google'
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { ThemeToggle } from "@/components/theme-toggle"

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ["300", "400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: "Hey Paytm - Voice Dining",
  description: "Voice-first restaurant ordering experience",
  generator: "v0.app",
  // <CHANGE> Updated favicon to use new Hey Paytm logo
  icons: {
    icon: "/hey-paytm-logo.png",
    apple: "/hey-paytm-logo.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="antialiased">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} ${poppins.variable}`}>
        <ThemeProvider>
          <Suspense fallback={null}>{children}</Suspense>
          <Analytics />
          <div className="fixed bottom-4 right-4 z-50">
            <ThemeToggle />
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
