"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import {
  getItemDetails,
  getEpisodes,
  getDownloadUrl,
  getImageUrl,
} from "@/lib/emby-api";
import {
  MediaItem,
  Episode,
  Season,
  formatDuration,
  formatSize,
  groupEpisodesBySeason,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { DownloadWarningDialog } from "@/components/download-warning-dialog";
import { SeasonDownloadDialog } from "@/components/season-download-dialog";
import { toast } from "sonner";

export default function SeriesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { credentials, isLoading: authLoading } = useAuth();
  const [series, setSeries] = useState<MediaItem | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState("");
  const [downloadFileName, setDownloadFileName] = useState("");
  const [showSeasonDownloadDialog, setShowSeasonDownloadDialog] = useState(false);
  const [seasonToDownload, setSeasonToDownload] = useState<Season | null>(null);

  useEffect(() => {
    if (!authLoading && !credentials) {
      router.replace("/login");
      return;
    }

    if (credentials && id) {
      loadSeriesData();
    }
  }, [authLoading, credentials, id]);

  const loadSeriesData = async () => {
    if (!credentials) return;

    try {
      const [seriesData, episodesData] = await Promise.all([
        getItemDetails(
          credentials.host,
          credentials.userId,
          credentials.token,
          id
        ),
        getEpisodes(
          credentials.host,
          credentials.userId,
          credentials.token,
          id
        ),
      ]);

      setSeries(seriesData);
      setSeasons(groupEpisodesBySeason(episodesData));
    } catch {
      toast.error("Error al cargar la serie");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadEpisode = (episode: Episode) => {
    if (!credentials || !series) return;

    const url = getDownloadUrl(credentials.host, episode.Id, credentials.token);
    const fileName = `${series.Name}_S${String(episode.ParentIndexNumber).padStart(2, "0")}E${String(episode.IndexNumber).padStart(2, "0")}_${episode.Name.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "_")}.${episode.Container || "mkv"}`;

    setDownloadUrl(url);
    setDownloadFileName(fileName);
    setShowDownloadDialog(true);
  };

  const downloadSeason = (season: Season) => {
    if (!credentials || !series) return;
    setSeasonToDownload(season);
    setShowSeasonDownloadDialog(true);
  };

  if (authLoading || !credentials) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          <Skeleton className="h-8 w-32 mb-6" />
          <div className="flex flex-col md:flex-row gap-6">
            <Skeleton className="w-full md:w-64 aspect-[2/3]" />
            <div className="flex-1 space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!series) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          <p className="text-muted-foreground">Serie no encontrada</p>
          <Link href="/search">
            <Button variant="link" className="px-0">
              Volver a búsqueda
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const imageUrl = getImageUrl(credentials.host, series.Id, "Primary", 400);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <Link href="/search">
          <Button variant="ghost" className="mb-6 -ml-2">
            ← Volver
          </Button>
        </Link>

        <div className="flex flex-col md:flex-row gap-6 mb-8">
          <div className="w-full md:w-64 shrink-0">
            <div className="aspect-[2/3] bg-muted rounded-lg overflow-hidden relative">
              <img
                src={imageUrl}
                alt={series.Name}
                className="object-cover w-full h-full"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm p-4 text-center -z-10">
                {series.Name}
              </div>
            </div>
          </div>

          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{series.Name}</h1>

            <div className="flex flex-wrap gap-2 mb-4">
              {series.ProductionYear && (
                <Badge variant="secondary">{series.ProductionYear}</Badge>
              )}
              <Badge variant="outline">
                {seasons.length} temporada{seasons.length !== 1 ? "s" : ""}
              </Badge>
              {series.OfficialRating && (
                <Badge variant="outline">{series.OfficialRating}</Badge>
              )}
            </div>

            {series.Genres && series.Genres.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-4">
                {series.Genres.map((genre) => (
                  <Badge key={genre} variant="outline" className="text-xs">
                    {genre}
                  </Badge>
                ))}
              </div>
            )}

            {series.Overview && (
              <p className="text-muted-foreground leading-relaxed">
                {series.Overview}
              </p>
            )}
          </div>
        </div>

        <h2 className="text-xl font-semibold mb-4">Temporadas y episodios</h2>

        <Accordion type="multiple" className="space-y-2">
          {seasons.map((season) => (
            <AccordionItem
              key={season.number}
              value={`season-${season.number}`}
              className="border rounded-lg px-4"
            >
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center justify-between w-full pr-4">
                  <span className="font-medium">Temporada {season.number}</span>
                  <Badge variant="secondary">
                    {season.episodes.length} episodio
                    {season.episodes.length !== 1 ? "s" : ""}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="pb-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="mb-4"
                    onClick={() => downloadSeason(season)}
                  >
                    Descargar temporada completa
                  </Button>

                  <div className="space-y-2">
                    {season.episodes.map((episode) => (
                      <EpisodeRow
                        key={episode.Id}
                        episode={episode}
                        onDownload={() => downloadEpisode(episode)}
                      />
                    ))}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <DownloadWarningDialog
          open={showDownloadDialog}
          onOpenChange={setShowDownloadDialog}
          downloadUrl={downloadUrl}
          fileName={downloadFileName}
        />

        <SeasonDownloadDialog
          open={showSeasonDownloadDialog}
          onOpenChange={setShowSeasonDownloadDialog}
          seasonNumber={seasonToDownload?.number || 0}
          episodes={
            seasonToDownload && credentials && series
              ? seasonToDownload.episodes.map((episode) => ({
                  id: episode.Id,
                  url: getDownloadUrl(credentials.host, episode.Id, credentials.token),
                  fileName: `${series.Name}_S${String(episode.ParentIndexNumber).padStart(2, "0")}E${String(episode.IndexNumber).padStart(2, "0")}_${episode.Name.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "_")}.${episode.Container || "mkv"}`,
                  episodeNumber: episode.IndexNumber,
                  episodeName: episode.Name,
                }))
              : []
          }
        />
      </div>
    </div>
  );
}

function EpisodeRow({
  episode,
  onDownload,
}: {
  episode: Episode;
  onDownload: () => void;
}) {
  return (
    <div
      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
      onClick={onDownload}
    >
      <div className="flex-1 min-w-0 mr-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground shrink-0">
            E{String(episode.IndexNumber).padStart(2, "0")}
          </span>
          <span className="font-medium truncate">{episode.Name}</span>
        </div>
        <div className="flex gap-2 mt-1">
          {episode.RunTimeTicks && (
            <span className="text-xs text-muted-foreground">
              {formatDuration(episode.RunTimeTicks)}
            </span>
          )}
          {episode.Size && (
            <span className="text-xs text-muted-foreground">
              {formatSize(episode.Size)}
            </span>
          )}
        </div>
      </div>
      <Button variant="ghost" size="sm" onClick={(e) => {
        e.stopPropagation();
        onDownload();
      }}>
        Descargar
      </Button>
    </div>
  );
}
