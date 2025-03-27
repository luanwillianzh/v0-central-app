"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState, useCallback } from "react"

type Novel = {
  id: string
  nome: string
  cover: string
  lastRead?: {
    chapter: string
    timestamp: number
  }
}

type EpubChapter = {
  id: string
  href: string
  label: string
  html: string
  index: number
}

type ImportedBook = {
  id: string
  title: string
  author?: string
  cover?: string
  fileName: string
  fileSize: number
  dateImported: number
  chapters: EpubChapter[]
  toc: any[]
  metadata: any
  lastLocation?: {
    chapterId: string
    position: number
    timestamp: number
  }
}

type DbContextType = {
  favorites: Novel[]
  history: Novel[]
  importedBooks: ImportedBook[]
  addToFavorites: (novel: Novel) => void
  removeFromFavorites: (novelId: string) => void
  isFavorite: (novelId: string) => boolean
  addToHistory: (novel: Novel, chapter: string) => void
  clearHistory: () => void
  importEpub: (file: File) => Promise<ImportedBook>
  removeImportedBook: (bookId: string) => void
  updateImportedBookProgress: (bookId: string, chapterId: string, position: number) => void
  getReadingProgress: (bookId: string) => { percentage: number; chapterIndex: number; totalChapters: number } | null
}

const DbContext = createContext<DbContextType | undefined>(undefined)

export function DbProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<Novel[]>([])
  const [history, setHistory] = useState<Novel[]>([])
  const [importedBooks, setImportedBooks] = useState<ImportedBook[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const loadedFavorites = localStorage.getItem("novel-favorites")
      const loadedHistory = localStorage.getItem("novel-history")
      const loadedImportedBooks = localStorage.getItem("novel-imported-books")

      if (loadedFavorites) {
        setFavorites(JSON.parse(loadedFavorites))
      }

      if (loadedHistory) {
        setHistory(JSON.parse(loadedHistory))
      }

      if (loadedImportedBooks) {
        setImportedBooks(JSON.parse(loadedImportedBooks))
      }
    } catch (e) {
      console.error("Failed to load data from localStorage", e)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // Save data to localStorage when it changes
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem("novel-favorites", JSON.stringify(favorites))
      } catch (e) {
        console.error("Failed to save favorites to localStorage", e)
      }
    }
  }, [favorites, isLoaded])

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem("novel-history", JSON.stringify(history))
      } catch (e) {
        console.error("Failed to save history to localStorage", e)
      }
    }
  }, [history, isLoaded])

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem("novel-imported-books", JSON.stringify(importedBooks))
      } catch (e) {
        console.error("Failed to save imported books to localStorage", e)
      }
    }
  }, [importedBooks, isLoaded])

  // Use useCallback to memoize functions to prevent unnecessary re-renders
  const addToFavorites = useCallback((novel: Novel) => {
    setFavorites((prev) => {
      if (prev.some((item) => item.id === novel.id)) {
        return prev
      }
      return [...prev, novel]
    })
  }, [])

  const removeFromFavorites = useCallback((novelId: string) => {
    setFavorites((prev) => prev.filter((item) => item.id !== novelId))
  }, [])

  const isFavorite = useCallback(
    (novelId: string) => {
      return favorites.some((item) => item.id === novelId)
    },
    [favorites],
  )

  const addToHistory = useCallback((novel: Novel, chapter: string) => {
    if (!novel.id || !novel.nome || !chapter) {
      console.warn("Invalid novel or chapter data for history", { novel, chapter })
      return
    }

    console.log("Adding to history:", novel.nome, chapter)

    setHistory((prev) => {
      // Remove the novel if it already exists in history
      const filtered = prev.filter((item) => item.id !== novel.id)

      // Add the novel with updated lastRead info
      return [
        {
          ...novel,
          lastRead: {
            chapter,
            timestamp: Date.now(),
          },
        },
        ...filtered,
      ].slice(0, 50) // Limit history to 50 items
    })
  }, [])

  const clearHistory = useCallback(() => {
    setHistory([])
  }, [])

  // Function to import EPUB file and convert to HTML
  const importEpub = useCallback(async (file: File): Promise<ImportedBook> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = async (event) => {
        try {
          if (!event.target || typeof event.target.result !== "string") {
            throw new Error("Failed to read file")
          }

          const arrayBuffer = await file.arrayBuffer()

          // Generate a unique ID for the book
          const id = `epub-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

          // Import epubjs dynamically
          const { default: ePub } = await import("epubjs")

          // Create a new book instance
          const book = ePub(arrayBuffer)

          // Get book metadata
          const metadata = await book.loaded.metadata

          // Get the table of contents
          const navigation = await book.loaded.navigation
          const toc = navigation.toc || []

          // Get the spine items (chapters)
          const spine = book.spine.items

          // Extract and convert each chapter to HTML
          const chapters: EpubChapter[] = []

          for (let i = 0; i < spine.length; i++) {
            const item = spine[i]
            const href = item.href

            // Get the document for this chapter
            const doc = await book.load(item.href)

            // Convert to HTML string
            const html = new XMLSerializer().serializeToString(doc)

            // Find a label for this chapter from the TOC
            let label = `Chapter ${i + 1}`

            // Procurar no TOC pelo item correspondente
            if (Array.isArray(toc)) {
              const tocItem = toc.find((t: any) => t.href && href.includes(t.href))
              if (tocItem) {
                label = tocItem.label || label
              }
            }

            chapters.push({
              id: `chapter-${i}`,
              href,
              label,
              html,
              index: i,
            })
          }

          // Extract cover image if available
          let coverUrl = undefined
          try {
            const cover = await book.coverUrl()
            if (cover) {
              coverUrl = cover
            }
          } catch (e) {
            console.warn("Could not extract cover image:", e)
          }

          // Create a new imported book entry
          const newBook: ImportedBook = {
            id,
            title: metadata.title || file.name.replace(/\.epub$/i, ""),
            author: metadata.creator,
            cover: coverUrl,
            fileName: file.name,
            fileSize: file.size,
            dateImported: Date.now(),
            chapters,
            toc,
            metadata,
          }

          // Add the book to the imported books list
          setImportedBooks((prev) => [...prev, newBook])

          // Clean up
          book.destroy()

          resolve(newBook)
        } catch (error) {
          console.error("Error importing EPUB:", error)
          reject(error)
        }
      }

      reader.onerror = (error) => {
        console.error("Error reading file:", error)
        reject(error)
      }

      // Read the file as an array buffer
      reader.readAsDataURL(file)
    })
  }, [])

  // Function to remove an imported book
  const removeImportedBook = useCallback((bookId: string) => {
    setImportedBooks((prev) => prev.filter((book) => book.id !== bookId))
  }, [])

  // Function to update reading progress for an imported book
  const updateImportedBookProgress = useCallback((bookId: string, chapterId: string, position: number) => {
    setImportedBooks((prev) => {
      // Find the book
      const bookIndex = prev.findIndex((book) => book.id === bookId)
      if (bookIndex === -1) return prev

      const book = prev[bookIndex]

      // Check if the update is actually different from current state
      if (
        book.lastLocation?.chapterId === chapterId &&
        Math.abs((book.lastLocation?.position || 0) - position) < 0.01
      ) {
        return prev // No change needed
      }

      // Create a new array with the updated book
      const newBooks = [...prev]
      newBooks[bookIndex] = {
        ...book,
        lastLocation: {
          chapterId,
          position,
          timestamp: Date.now(),
        },
      }

      return newBooks
    })
  }, [])

  // Function to calculate reading progress for a book
  const getReadingProgress = useCallback(
    (bookId: string) => {
      const book = importedBooks.find((b) => b.id === bookId)
      if (!book || !book.chapters || book.chapters.length === 0 || !book.lastLocation) {
        return null
      }

      const currentChapterIndex = book.chapters.findIndex((c) => c.id === book.lastLocation?.chapterId)
      if (currentChapterIndex === -1) {
        return null
      }

      // Calculate approximate percentage based on chapters and position within current chapter
      const totalChapters = book.chapters.length
      const chapterProgress = book.lastLocation.position || 0

      // Calculate overall percentage: completed chapters + progress in current chapter
      const completedChaptersPercentage = (currentChapterIndex / totalChapters) * 100
      const currentChapterPercentage = (chapterProgress / totalChapters) * 100
      const percentage = Math.min(completedChaptersPercentage + currentChapterPercentage, 100)

      return {
        percentage: Math.round(percentage),
        chapterIndex: currentChapterIndex,
        totalChapters,
      }
    },
    [importedBooks],
  )

  return (
    <DbContext.Provider
      value={{
        favorites,
        history,
        importedBooks,
        addToFavorites,
        removeFromFavorites,
        isFavorite,
        addToHistory,
        clearHistory,
        importEpub,
        removeImportedBook,
        updateImportedBookProgress,
        getReadingProgress,
      }}
    >
      {children}
    </DbContext.Provider>
  )
}

export function useDb() {
  const context = useContext(DbContext)
  if (context === undefined) {
    throw new Error("useDb must be used within a DbProvider")
  }
  return context
}

