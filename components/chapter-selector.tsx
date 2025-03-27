"use client"

import { useState } from "react"
import { Book, ChevronDown, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ChapterSelectorProps {
  chapters: Array<{
    id: string
    label: string
    index: number
  }>
  currentChapterIndex: number
  onSelectChapter: (index: number) => void
}

export function ChapterSelector({ chapters, currentChapterIndex, onSelectChapter }: ChapterSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const filteredChapters = chapters.filter((chapter) => chapter.label.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Book className="h-4 w-4" />
          <span className="hidden sm:inline">Capítulos</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 md:w-80">
        <DropdownMenuLabel>Selecionar Capítulo</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="p-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar capítulo..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <DropdownMenuGroup>
          <ScrollArea className="h-[300px]">
            {filteredChapters.length > 0 ? (
              filteredChapters.map((chapter) => (
                <DropdownMenuItem
                  key={chapter.id}
                  className={`flex items-center gap-2 cursor-pointer ${
                    chapter.index === currentChapterIndex ? "bg-muted" : ""
                  }`}
                  onClick={() => {
                    onSelectChapter(chapter.index)
                    setIsOpen(false)
                  }}
                >
                  <span className="text-sm font-medium w-8 text-muted-foreground">{chapter.index + 1}.</span>
                  <span className="flex-1 truncate">{chapter.label}</span>
                </DropdownMenuItem>
              ))
            ) : (
              <div className="p-2 text-center text-muted-foreground">Nenhum capítulo encontrado</div>
            )}
          </ScrollArea>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

