import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Book, BookMarked } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChapterList } from "@/components/chapter-list"
import { ThemeToggle } from "@/components/theme-toggle"
import { FavoriteButton } from "@/components/favorite-button"
import { NovelDownloader } from "@/components/novel-downloader"

interface NovelPageProps {
  params: {
    id: string
  }
}

export default async function NovelPage({ params }: NovelPageProps) {
  const novel = await fetchNovel(params.id)

  if (!novel) {
    return <div className="container py-10">Novel not found</div>
  }

  // Convert the novel to the format expected by the FavoriteButton
  const favoriteNovel = {
    id: params.id,
    nome: novel.nome,
    cover: novel.cover,
  }

  return (
    <div className="bg-background text-foreground min-h-screen">
      <div className="container px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="inline-flex items-center gap-1 text-sm">
            <ArrowLeft className="h-4 w-4" />
            Back to novels
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" asChild>
              <Link href="/library">
                <BookMarked className="h-[1.2rem] w-[1.2rem]" />
                <span className="sr-only">My Library</span>
              </Link>
            </Button>
            <ThemeToggle />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-[200px_1fr]">
          <div className="aspect-[2/3] relative w-full max-w-[200px] mx-auto md:mx-0">
            <Image
              src={novel.cover || "/placeholder.svg?height=300&width=200"}
              alt={novel.nome}
              fill
              className="object-cover rounded-md"
              sizes="(max-width: 768px) 50vw, 200px"
              priority
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-2xl font-bold">{novel.nome}</h1>
              <FavoriteButton novel={favoriteNovel} />
            </div>

            <div className="flex gap-2 mb-4">
              <Badge variant="outline" className="flex items-center gap-1">
                <Book className="h-3 w-3" />
                {novel.chapters.length} chapters
              </Badge>
            </div>

            <p className="mb-6">{novel.desc}</p>

            {novel.chapters.length > 0 && (
              <div className="flex gap-3 mb-8">
                <Button asChild>
                  <Link href={`/novel/${params.id}/read/${novel.chapters[0]}`}>Start Reading</Link>
                </Button>
                <NovelDownloader novelId={params.id} novelTitle={novel.nome} chapters={novel.chapters} />
              </div>
            )}

            <h2 className="text-xl font-semibold mb-4">Chapters</h2>
            <ChapterList novelId={params.id} chapters={novel.chapters} />
          </div>
        </div>
      </div>
    </div>
  )
}

// Function to fetch a specific novel from API
async function fetchNovel(id: string) {
  try {
    // Add retry logic
    let retries = 3
    let lastError

    while (retries > 0) {
      try {
        const response = await fetch(`https://central-nu.vercel.app/novel/${id}`, {
          cache: "no-store",
        })

        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`)
        }

        return await response.json()
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
    console.error("Error fetching novel:", error)
    return null
  }
}

