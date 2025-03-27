"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { WifiOff, RefreshCw } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

export default function OfflinePage() {
  return (
    <div className="bg-background text-foreground min-h-screen">
      <div className="container flex flex-col items-center justify-center min-h-screen px-4 py-6 text-center">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <WifiOff className="h-16 w-16 mb-6 text-muted-foreground" />
        <h1 className="text-3xl font-bold mb-4">You're offline</h1>
        <p className="text-muted-foreground mb-8 max-w-md">
          It looks like you're offline or our API is currently unavailable. Please check your connection and try again.
        </p>
        <div className="flex gap-4">
          <Button onClick={() => window.location.reload()} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

