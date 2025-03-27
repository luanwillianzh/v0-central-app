"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { ArrowLeft, Book } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { useDb } from "@/lib/db-context"
import { FontControls } from "@/components/font-controls"
import dynamic from "next/dynamic"

// Importar o componente do leitor HTML dinamicamente para evitar problemas de SSR
const HtmlReader = dynamic(() => import("@/components/html-reader"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
        <p>Carregando livro...</p>
      </div>
    </div>
  ),
})

interface EpubReaderPageProps {
  params: {
    id: string
  }
}

export default function EpubReaderPage({ params }: EpubReaderPageProps) {
  const { id } = params
  const { importedBooks, updateImportedBookProgress } = useDb()
  const [book, setBook] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [readingStats, setReadingStats] = useState<{
    currentChapter: string | null
    position: number
    lastUpdated: Date | null
  }>({
    currentChapter: null,
    position: 0,
    lastUpdated: null,
  })

  useEffect(() => {
    // Find the book in the imported books
    const foundBook = importedBooks.find((book) => book.id === id)
    if (foundBook) {
      setBook(foundBook)

      // Set initial reading stats
      if (foundBook.lastLocation) {
        setReadingStats({
          currentChapter: foundBook.lastLocation.chapterId,
          position: foundBook.lastLocation.position,
          lastUpdated: new Date(foundBook.lastLocation.timestamp),
        })
      }
    } else {
      setError("Livro não encontrado")
    }
  }, [id, importedBooks])

  // Memoize the handleChapterChange function to avoid recreating it on every render
  const handleChapterChange = useCallback(
    (chapterId: string, position: number) => {
      if (book && book.id) {
        // Check if the position is actually different from the current one
        const currentPosition = book.lastLocation?.position || 0
        const currentChapterId = book.lastLocation?.chapterId || ""

        if (chapterId !== currentChapterId || Math.abs(position - currentPosition) > 0.01) {
          updateImportedBookProgress(book.id, chapterId, position)

          // Update reading stats
          setReadingStats({
            currentChapter: chapterId,
            position: position,
            lastUpdated: new Date(),
          })
        }
      }
    },
    [book, updateImportedBookProgress],
  )

  if (error) {
    return (
      <div className="bg-background text-foreground min-h-screen">
        <div className="container px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <Link href="/library" className="inline-flex items-center gap-1 text-sm">
              <ArrowLeft className="h-4 w-4" />
              Voltar para a biblioteca
            </Link>
            <ThemeToggle />
          </div>

          <div className="flex flex-col items-center justify-center py-20">
            <h1 className="text-2xl font-bold mb-4">Erro</h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button asChild>
              <Link href="/library">Voltar para a biblioteca</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!book) {
    return (
      <div className="bg-background text-foreground min-h-screen">
        <div className="container px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <Link href="/library" className="inline-flex items-center gap-1 text-sm">
              <ArrowLeft className="h-4 w-4" />
              Voltar para a biblioteca
            </Link>
            <ThemeToggle />
          </div>

          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
            <p>Carregando livro...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background text-foreground min-h-screen flex flex-col">
      <header className="border-b sticky top-0 bg-background z-10">
        <div className="container flex items-center justify-between h-14 px-4">
          <Link href="/library" className="flex items-center gap-1 text-sm">
            <ArrowLeft className="h-4 w-4" />
            Voltar para a biblioteca
          </Link>

          <div className="text-sm font-medium truncate max-w-[50%]">{book.title}</div>

          <div className="flex items-center gap-2">
            <FontControls />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 relative">
        {book.chapters && book.chapters.length > 0 ? (
          <>
            <HtmlReader
              chapters={book.chapters}
              initialChapterId={book.lastLocation?.chapterId}
              initialPosition={book.lastLocation?.position || 0}
              onChapterChange={handleChapterChange}
              bookId={book.id}
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <Book className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Este livro não possui capítulos ou está em processamento</p>
            <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
              Recarregar
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}

