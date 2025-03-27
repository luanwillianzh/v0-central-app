import Link from "next/link"

import { Button } from "@/components/ui/button"

interface ChapterListProps {
  novelId: string
  chapters: string[]
}

export function ChapterList({ novelId, chapters }: ChapterListProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
      {chapters.map((chapterId, index) => (
        <Button key={chapterId} variant="outline" asChild className="justify-start bg-card hover:bg-card/80">
          <Link href={`/novel/${novelId}/read/${chapterId}`}>Chapter {index + 1}</Link>
        </Button>
      ))}
    </div>
  )
}

