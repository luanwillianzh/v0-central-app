import Link from "next/link"
import Image from "next/image"

import { Card, CardContent } from "@/components/ui/card"
import { FavoriteButton } from "@/components/favorite-button"

interface Novel {
  nome: string
  url: string
  cover: string
}

interface NovelCardProps {
  novel: Novel
}

export function NovelCard({ novel }: NovelCardProps) {
  // Convert the novel to the format expected by the FavoriteButton
  const favoriteNovel = {
    id: novel.url,
    nome: novel.nome,
    cover: novel.cover,
  }

  return (
    <Link href={`/novel/${novel.url}`}>
      <Card className="h-full overflow-hidden transition-all hover:shadow-md bg-card text-card-foreground group relative">
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <FavoriteButton novel={favoriteNovel} />
        </div>
        <div className="aspect-[2/3] relative">
          <Image
            src={novel.cover || "/placeholder.svg?height=300&width=200"}
            alt={novel.nome}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 33vw"
          />
        </div>
        <CardContent className="p-3">
          <h2 className="font-semibold line-clamp-2">{novel.nome}</h2>
        </CardContent>
      </Card>
    </Link>
  )
}

