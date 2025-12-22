"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MediaItem, formatDuration } from "@/lib/types";
import { getImageUrl } from "@/lib/emby-api";

interface MediaCardProps {
  item: MediaItem;
  host: string;
}

export function MediaCard({ item, host }: MediaCardProps) {
  const href = item.Type === "Movie" ? `/movie/${item.Id}` : `/series/${item.Id}`;
  const imageUrl = getImageUrl(host, item.Id, "Primary", 300);

  return (
    <Link href={href}>
      <Card className="overflow-hidden hover:ring-2 hover:ring-primary transition-all cursor-pointer h-full">
        <div className="aspect-[2/3] relative bg-muted">
          <img
            src={imageUrl}
            alt={item.Name}
            className="object-cover w-full h-full"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm p-4 text-center">
            {item.Name}
          </div>
        </div>
        <CardContent className="p-3">
          <h3 className="font-medium text-sm line-clamp-2 mb-2">{item.Name}</h3>
          <div className="flex flex-wrap gap-1">
            <Badge variant="secondary" className="text-xs">
              {item.Type === "Movie" ? "Película" : "Serie"}
            </Badge>
            {item.ProductionYear && (
              <Badge variant="outline" className="text-xs">
                {item.ProductionYear}
              </Badge>
            )}
            {item.RunTimeTicks && item.Type === "Movie" && (
              <Badge variant="outline" className="text-xs">
                {formatDuration(item.RunTimeTicks)}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
