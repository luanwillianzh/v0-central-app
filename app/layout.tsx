import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import "./epub-reader.css"
import { ThemeProvider } from "@/components/theme-provider"
import { DbProvider } from "@/lib/db-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Novel Reader",
  description: "A simple novel reader application",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-background min-h-screen`}>
        <ThemeProvider defaultTheme="dark">
          <DbProvider>{children}</DbProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}



import './globals.css'