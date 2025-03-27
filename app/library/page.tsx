"use client"

import { useDb } from "@/lib/db-context"
import { NovelCard } from "@/components/novel-card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { ArrowLeft, Clock, Heart, Trash2, Book, FileText } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { formatDistanceToNow } from "date-fns"
import { useEffect, useState } from "react"
import { EpubImport } from "@/components/epub-import"
import { Progress } from "@/components/ui/progress"

export default function LibraryPage() {
  const { favorites, history, importedBooks, clearHistory, removeImportedBook, getReadingProgress } = useDb()
  const [mounted, setMounted] = useState(false)

  // Only render after component has mounted to avoid hydration issues
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
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
          <h1 className="text-2xl font-bold mb-6">My Library</h1>
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-muted rounded w-64"></div>
            <div className="h-40 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    )
  }

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

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">My Library</h1>
          <EpubImport />
        </div>

        <Tabs defaultValue="favorites" className="mb-8">
          <TabsList>
            <TabsTrigger value="favorites" className="flex items-center gap-1">
              <Heart className="h-4 w-4" />
              Favorites ({favorites.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Reading History ({history.length})
            </TabsTrigger>
            <TabsTrigger value="imported" className="flex items-center gap-1">
              <Book className="h-4 w-4" />
              Imported Books ({importedBooks.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="favorites" className="mt-6">
            {favorites.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {favorites.map((novel) => (
                  <NovelCard
                    key={novel.id}
                    novel={{
                      nome: novel.nome,
                      url: novel.id,
                      cover: novel.cover,
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-muted-foreground">You haven't added any favorites yet.</p>
                <Button asChild className="mt-4">
                  <Link href="/">Browse Novels</Link>
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            {history.length > 0 ? (
              <>
                <div className="flex justify-end mb-4">
                  <Button variant="outline" size="sm" onClick={clearHistory} className="flex items-center gap-1">
                    <Trash2 className="h-4 w-4" />
                    Clear History
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {history.map((novel) => (
                    <div key={novel.id} className="flex gap-4 p-4 rounded-lg border bg-card text-card-foreground">
                      <div className="w-16 h-24 relative flex-shrink-0">
                        <img
                          src={novel.cover || "/placeholder.svg?height=150&width=100"}
                          alt={novel.nome}
                          className="absolute inset-0 w-full h-full object-cover rounded"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold line-clamp-1">{novel.nome}</h3>
                        {novel.lastRead && (
                          <>
                            <p className="text-sm text-muted-foreground mt-1">
                              Last read: Chapter {novel.lastRead.chapter.split("-").pop()}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDistanceToNow(novel.lastRead.timestamp, { addSuffix: true })}
                            </p>
                          </>
                        )}
                        <div className="mt-2">
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/novel/${novel.id}/read/${novel.lastRead?.chapter || ""}`}>
                              Continue Reading
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-10">
                <p className="text-muted-foreground">Your reading history is empty.</p>
                <Button asChild className="mt-4">
                  <Link href="/">Start Reading</Link>
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="imported" className="mt-6">
            {importedBooks.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {importedBooks.map((book) => {
                  const progress = getReadingProgress(book.id)

                  return (
                    <div key={book.id} className="flex gap-4 p-4 rounded-lg border bg-card text-card-foreground">
                      <div className="w-16 h-24 relative flex-shrink-0 bg-muted flex items-center justify-center">
                        {book.cover ? (
                          <img
                            src={book.cover || "/placeholder.svg"}
                            alt={book.title}
                            className="absolute inset-0 w-full h-full object-cover rounded"
                          />
                        ) : (
                          <Book className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold line-clamp-1">{book.title}</h3>
                        {book.author && <p className="text-sm text-muted-foreground mt-1">por {book.author}</p>}
                        <div className="flex items-center gap-2 mt-1">
                          <FileText className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{book.chapters?.length || 0} capítulos</span>
                        </div>

                        {progress && (
                          <div className="mt-2">
                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                              <span>Progresso: {progress.percentage}%</span>
                              <span>
                                Cap. {progress.chapterIndex + 1} de {progress.totalChapters}
                              </span>
                            </div>
                            <Progress value={progress.percentage} className="h-1" />
                          </div>
                        )}

                        <p className="text-xs text-muted-foreground mt-2">
                          Importado {formatDistanceToNow(book.dateImported, { addSuffix: true })}
                        </p>

                        {book.lastLocation && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Última leitura {formatDistanceToNow(book.lastLocation.timestamp, { addSuffix: true })}
                          </p>
                        )}

                        <div className="mt-2 flex gap-2">
                          <Button asChild size="sm">
                            <Link href={`/library/epub/${book.id}`}>{book.lastLocation ? "Continuar" : "Ler"}</Link>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeImportedBook(book.id)}
                            className="text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-muted-foreground">You haven't imported any books yet.</p>
                <div className="mt-4 flex justify-center">
                  <EpubImport />
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

