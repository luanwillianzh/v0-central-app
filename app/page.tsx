import { Book, Search, BookMarked } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { NovelCard } from "@/components/novel-card"
import { ThemeToggle } from "@/components/theme-toggle"

export default async function Home() {
  // Fetch popular novels or recent updates as default content
  const initialNovels = await searchNovels("novel")

  return (
    <div className="bg-background text-foreground min-h-screen">
      <div className="container px-4 py-6 md:py-10">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Book className="h-6 w-6" />
              Novel Reader
            </h1>
            <p className="text-muted-foreground mt-2">Discover and read your favorite novels</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" asChild>
              <Link href="/library">
                <BookMarked className="h-[1.2rem] w-[1.2rem]" />
                <span className="sr-only">My Library</span>
              </Link>
            </Button>
            <ThemeToggle />
          </div>
        </header>

        <form action="/search" className="relative mb-6">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input name="q" placeholder="Search novels..." className="pl-10" />
          <Button type="submit" className="absolute right-0 top-0">
            Search
          </Button>
        </form>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {initialNovels.length > 0 ? (
            initialNovels.map((novel) => <NovelCard key={novel.url} novel={novel} />)
          ) : (
            <div className="col-span-full text-center py-10">
              <p className="text-muted-foreground">No novels found. Try searching for something else.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Function to search novels from API
async function searchNovels(query: string) {
  try {
    // Add retry logic
    let retries = 3
    let lastError

    while (retries > 0) {
      try {
        const response = await fetch(
          `https://central-nu.vercel.app/search/${encodeURIComponent(query).replace(/%20/g, "+")}`,
          {
            cache: "no-store",
          },
        )

        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`)
        }

        const data = await response.json()

        if (!data.sucesso) {
          console.warn("API returned success: false", data)
          return []
        }

        return data.resultado || []
      } catch (error) {
        lastError = error
        retries--
        if (retries > 0) {
          // Wait before retrying (exponential backoff)
          await new Promise((resolve) => setTimeout(resolve, 1000 * (3 - retries)))
        }
      }
    }

    throw lastError
  } catch (error) {
    console.error("Error searching novels:", error)
    return []
  }
}

