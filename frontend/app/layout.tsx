import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Poppins } from 'next/font/google'
import dynamic from 'next/dynamic'
import { Suspense } from "react"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { ToastProvider } from "@/components/providers/toast-provider"

// Load Analytics and ThemeToggle dynamically on the client to avoid
// bundling them into the initial SSR payload and reduce hydration time.
const Analytics = dynamic(() => import('@vercel/analytics/next').then((m) => m.Analytics), {
  ssr: false,
})
const ThemeToggle = dynamic(() => import('@/components/theme-toggle').then((m) => m.ThemeToggle), {
  ssr: false,
})

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
          <ToastProvider>
            <Suspense fallback={null}>{children}</Suspense>
            <Analytics />
            {/* <div className="fixed bottom-4 right-4 z-50">
              <ThemeToggle />
            </div> */}
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
