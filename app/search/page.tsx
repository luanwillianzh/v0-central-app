import { NovelCard } from "@/components/novel-card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Search } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

interface SearchPageProps {
  searchParams: { q?: string }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams.q || ""
  const results = query ? await searchNovels(query) : []

  return (
    <div className="bg-background text-foreground min-h-screen">
      <div className="container px-4 py-6 md:py-10">
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="inline-flex items-center gap-1 text-sm">
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
          <ThemeToggle />
        </div>

        <h1 className="text-2xl font-bold mb-6">Search Results</h1>

        <form action="/search" className="relative mb-8">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input name="q" defaultValue={query} placeholder="Search novels..." className="pl-10" />
          <Button type="submit" className="absolute right-0 top-0">
            Search
          </Button>
        </form>

        {query && (
          <p className="mb-6">
            {results.length} results for "{query}"
          </p>
        )}

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {results.map((novel) => (
            <NovelCard key={novel.url} novel={novel} />
          ))}
        </div>

        {query && results.length === 0 && (
          <div className="text-center py-10">
            <p className="text-muted-foreground">No novels found for "{query}"</p>
          </div>
        )}
      </div>
    </div>
  )
}

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

