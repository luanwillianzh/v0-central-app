"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ChapterSelector } from "@/components/chapter-selector"

interface HtmlReaderProps {
  chapters: Array<{
    id: string
    html: string
    label: string
    index: number
  }>
  initialChapterId?: string
  initialPosition?: number
  onChapterChange?: (chapterId: string, position: number) => void
  bookId?: string
}

export default function HtmlReader({
  chapters,
  initialChapterId,
  initialPosition = 0,
  onChapterChange,
  bookId,
}: HtmlReaderProps) {
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0)
  const contentRef = useRef<HTMLDivElement>(null)
  const lastSavedPositionRef = useRef<{ chapterId: string; position: number } | null>(null)
  const [hasRestoredPosition, setHasRestoredPosition] = useState(false)

  // Set initial chapter
  useEffect(() => {
    if (initialChapterId && chapters.length > 0) {
      const index = chapters.findIndex((chapter) => chapter.id === initialChapterId)
      if (index !== -1) {
        setCurrentChapterIndex(index)
      }
    }
  }, [initialChapterId, chapters])

  // Restore scroll position when chapter is loaded
  useEffect(() => {
    if (!hasRestoredPosition && contentRef.current && initialChapterId && initialPosition > 0) {
      const currentChapter = chapters[currentChapterIndex]
      if (currentChapter && currentChapter.id === initialChapterId) {
        // Delay to ensure content is rendered
        setTimeout(() => {
          if (contentRef.current) {
            const scrollHeight = contentRef.current.scrollHeight
            contentRef.current.scrollTop = scrollHeight * initialPosition
            setHasRestoredPosition(true)
          }
        }, 100)
      }
    }
  }, [currentChapterIndex, chapters, initialChapterId, initialPosition, hasRestoredPosition])

  // Memoize the save position function to avoid recreating it on every render
  const savePosition = useCallback(() => {
    if (chapters.length === 0 || !contentRef.current) return

    const currentChapter = chapters[currentChapterIndex]
    if (!currentChapter) return

    const scrollPosition = contentRef.current.scrollTop / contentRef.current.scrollHeight

    // Only update if position has changed significantly (more than 1%)
    const lastSaved = lastSavedPositionRef.current
    const hasChangedSignificantly =
      !lastSaved || lastSaved.chapterId !== currentChapter.id || Math.abs(lastSaved.position - scrollPosition) > 0.01

    if (hasChangedSignificantly && onChapterChange) {
      lastSavedPositionRef.current = {
        chapterId: currentChapter.id,
        position: scrollPosition,
      }
      onChapterChange(currentChapter.id, scrollPosition)
    }
  }, [chapters, currentChapterIndex, onChapterChange])

  // Save position periodically while reading
  useEffect(() => {
    const saveInterval = setInterval(savePosition, 5000) // Save every 5 seconds

    return () => {
      clearInterval(saveInterval)
      savePosition() // Save on unmount
    }
  }, [savePosition])

  // Save position when chapter changes
  useEffect(() => {
    return () => {
      savePosition()
    }
  }, [currentChapterIndex, savePosition])

  // Restore scroll position
  useEffect(() => {
    if (!chapters || chapters.length === 0 || !contentRef.current) return

    const currentChapter = chapters[currentChapterIndex]
    if (!currentChapter) return

    // Apply font size from CSS variable
    const fontSize = getComputedStyle(document.documentElement).getPropertyValue("--reader-font-size").trim() || "16px"

    if (contentRef.current) {
      contentRef.current.style.fontSize = fontSize
    }

    // Apply dark mode if needed
    const isDarkMode = document.documentElement.classList.contains("dark")
    if (contentRef.current) {
      if (isDarkMode) {
        contentRef.current.classList.add("dark-mode")
      } else {
        contentRef.current.classList.remove("dark-mode")
      }
    }
  }, [currentChapterIndex, chapters])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        goToNextChapter()
      } else if (e.key === "ArrowLeft") {
        goToPrevChapter()
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [currentChapterIndex, chapters.length])

  // Efeito para rolar para o topo quando o capítulo muda
  useEffect(() => {
    // Rolar para o topo quando o capítulo mudar (exceto na primeira carga)
    if (contentRef.current && hasRestoredPosition) {
      contentRef.current.scrollTop = 0
    }
  }, [currentChapterIndex, hasRestoredPosition])

  // Função simplificada para ir para o próximo capítulo
  const goToNextChapter = () => {
    if (currentChapterIndex < chapters.length - 1) {
      // Salvar posição atual
      savePosition()

      // Mudar para o próximo capítulo
      setCurrentChapterIndex(currentChapterIndex + 1)

      // Rolar para o topo após a renderização
      setTimeout(() => {
        if (contentRef.current) {
          contentRef.current.scrollTop = 0
        }
      }, 50)
    }
  }

  // Função simplificada para ir para o capítulo anterior
  const goToPrevChapter = () => {
    if (currentChapterIndex > 0) {
      // Salvar posição atual
      savePosition()

      // Mudar para o capítulo anterior
      setCurrentChapterIndex(currentChapterIndex - 1)

      // Rolar para o topo após a renderização
      setTimeout(() => {
        if (contentRef.current) {
          contentRef.current.scrollTop = 0
        }
      }, 50)
    }
  }

  // Função simplificada para selecionar um capítulo específico
  const selectChapter = (index: number) => {
    if (index >= 0 && index < chapters.length && index !== currentChapterIndex) {
      // Salvar posição atual
      savePosition()

      // Mudar para o capítulo selecionado
      setCurrentChapterIndex(index)

      // Rolar para o topo após a renderização
      setTimeout(() => {
        if (contentRef.current) {
          contentRef.current.scrollTop = 0
        }
      }, 50)
    }
  }

  if (chapters.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Nenhum capítulo disponível</p>
      </div>
    )
  }

  const currentChapter = chapters[currentChapterIndex]

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-2 border-b">
        <Button
          variant="ghost"
          size="sm"
          onClick={goToPrevChapter}
          disabled={currentChapterIndex === 0}
          className="flex items-center gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Anterior</span>
        </Button>

        <div className="flex items-center gap-2">
          <ChapterSelector
            chapters={chapters}
            currentChapterIndex={currentChapterIndex}
            onSelectChapter={selectChapter}
          />
          <div className="text-sm font-medium truncate max-w-[150px] hidden sm:block">{currentChapter.label}</div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={goToNextChapter}
          disabled={currentChapterIndex === chapters.length - 1}
          className="flex items-center gap-1"
        >
          <span className="hidden sm:inline">Próximo</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div
        ref={contentRef}
        className="flex-1 overflow-auto p-4 reader-content epub-content"
        dangerouslySetInnerHTML={{ __html: currentChapter.html }}
      />

      <div className="flex justify-between items-center p-2 border-t">
        <Button variant="outline" size="sm" onClick={goToPrevChapter} disabled={currentChapterIndex === 0}>
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="text-sm">
          {currentChapterIndex + 1} / {chapters.length}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={goToNextChapter}
          disabled={currentChapterIndex === chapters.length - 1}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

