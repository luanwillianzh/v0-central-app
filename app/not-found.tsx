import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Search, Home } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

export default function NotFound() {
  return (
    <div className="bg-background text-foreground min-h-screen">
      <div className="container flex flex-col items-center justify-center min-h-screen px-4 py-6 text-center">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <h1 className="text-3xl font-bold mb-4">404 - Page Not Found</h1>
        <p className="text-muted-foreground mb-8 max-w-md">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex gap-4">
          <Button asChild>
            <Link href="/" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Go Home
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/search" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Search Novels
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

