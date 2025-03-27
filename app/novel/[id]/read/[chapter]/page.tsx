"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight, ChevronLeft, BookMarked } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { useDb } from "@/lib/db-context"
import { FontControls } from "@/components/font-controls"

interface ReadPageProps {
  params: {
    id: string
    chapter: string
  }
}

export default function ReadPage({ params }: ReadPageProps) {
  const { id, chapter } = params
  const { addToHistory } = useDb()

  // Estados para dados do capítulo e romance
  const [chapterData, setChapterData] = useState<any>(null)
  const [novelData, setNovelData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [novelChapters, setNovelChapters] = useState<string[]>([])
  const [currentChapterIndex, setCurrentChapterIndex] = useState(-1)
  const [error, setError] = useState<string | null>(null)

  // Fetch novel info
  useEffect(() => {
    async function fetchNovelInfo() {
      try {
        const response = await fetch(`/api/novels/${id}`)
        if (!response.ok) throw new Error("Failed to fetch novel")

        const data = await response.json()
        setNovelData(data)
        setNovelChapters(data.chapters)
        setCurrentChapterIndex(data.chapters.indexOf(chapter))

        // Add to history
        if (data.nome) {
          setTimeout(() => {
            addToHistory(
              {
                id,
                nome: data.nome,
                cover: data.cover,
              },
              chapter,
            )
          }, 100)
        }
      } catch (error) {
        console.error("Error fetching novel:", error)
        setError("Failed to load novel information")
      }
    }

    fetchNovelInfo()
  }, [id, chapter, addToHistory])

  // Fetch chapter content
  useEffect(() => {
    async function fetchChapter() {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/chapters/${chapter}`)
        if (!response.ok) throw new Error("Failed to fetch chapter")

        const data = await response.json()
        setChapterData(data)
      } catch (error) {
        console.error("Error fetching chapter:", error)
        setError("Failed to load chapter content")
      } finally {
        setIsLoading(false)
      }
    }

    if (chapter) {
      fetchChapter()
    }
  }, [chapter])

  // Navegação entre capítulos
  const prevChapter = currentChapterIndex > 0 ? novelChapters[currentChapterIndex - 1] : null
  const nextChapter = currentChapterIndex < novelChapters.length - 1 ? novelChapters[currentChapterIndex + 1] : null

  return (
    <div className="bg-background text-foreground min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background z-10">
        <div className="container flex items-center justify-between h-14 px-4">
          <Link href={`/novel/${id}`} className="flex items-center gap-1 text-sm">
            <ChevronLeft className="h-4 w-4" />
            Back to novel
          </Link>

          <div className="flex items-center gap-2">
            <div className="hidden md:block">
              <FontControls />
            </div>

            <Button variant="ghost" size="icon" asChild>
              <Link href="/library">
                <BookMarked className="h-[1.2rem] w-[1.2rem]" />
              </Link>
            </Button>

            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 container px-4 py-8 max-w-3xl mx-auto">
        {isLoading ? (
          <div className="space-y-4">
            <div className="h-8 bg-muted rounded animate-pulse w-1/2 mx-auto" />
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded animate-pulse" />
          </div>
        ) : error ? (
          <div className="text-center py-10">
            <p className="text-red-500">{error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Try Again
            </Button>
          </div>
        ) : (
          <div className="space-y-6 chapter-container">
            <div className="text-center">
              <h1 className="chapter-title">{chapterData?.title}</h1>
              <p className="chapter-subtitle text-muted-foreground">{chapterData?.subtitle}</p>
            </div>

            {/* Aplicamos a classe reader-content para usar as variáveis CSS */}
            <div
              className="reader-content prose prose-sm sm:prose max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: chapterData?.content || "" }}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t py-4 sticky bottom-0 bg-background">
        <div className="container px-4 flex justify-between">
          <Button variant="outline" disabled={!prevChapter} asChild={!!prevChapter}>
            {prevChapter ? (
              <Link href={`/novel/${id}/read/${prevChapter}`} className="flex items-center gap-1">
                <ArrowLeft className="h-4 w-4" />
                Previous
              </Link>
            ) : (
              <span className="flex items-center gap-1">
                <ArrowLeft className="h-4 w-4" />
                Previous
              </span>
            )}
          </Button>

          <div className="md:hidden">
            <FontControls />
          </div>

          <Button variant="outline" disabled={!nextChapter} asChild={!!nextChapter}>
            {nextChapter ? (
              <Link href={`/novel/${id}/read/${nextChapter}`} className="flex items-center gap-1">
                Next
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <span className="flex items-center gap-1">
                Next
                <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </Button>
        </div>
      </footer>
    </div>
  )
}

