"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { getItemDetails, getDownloadUrl, getImageUrl } from "@/lib/emby-api";
import { MediaItem, formatDuration, formatSize } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DownloadWarningDialog } from "@/components/download-warning-dialog";
import { toast } from "sonner";

export default function MoviePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { credentials, isLoading: authLoading } = useAuth();
  const [movie, setMovie] = useState<MediaItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState("");
  const [downloadFileName, setDownloadFileName] = useState("");

  useEffect(() => {
    if (!authLoading && !credentials) {
      router.replace("/login");
      return;
    }

    if (credentials && id) {
      loadMovie();
    }
  }, [authLoading, credentials, id]);

  const loadMovie = async () => {
    if (!credentials) return;

    try {
      const data = await getItemDetails(
        credentials.host,
        credentials.userId,
        credentials.token,
        id
      );
      setMovie(data);
    } catch {
      toast.error("Error al cargar la película");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!credentials || !movie) return;

    const url = getDownloadUrl(credentials.host, movie.Id, credentials.token);
    const fileName = `${movie.Name.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "_")}.${movie.Container || "mkv"}`;

    setDownloadUrl(url);
    setDownloadFileName(fileName);
    setShowDownloadDialog(true);
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
              <Skeleton className="h-10 w-40" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          <p className="text-muted-foreground">Película no encontrada</p>
          <Link href="/search">
            <Button variant="link" className="px-0">
              Volver a búsqueda
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const imageUrl = getImageUrl(credentials.host, movie.Id, "Primary", 400);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <Link href="/search">
          <Button variant="ghost" className="mb-6 -ml-2">
            ← Volver
          </Button>
        </Link>

        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-64 shrink-0">
            <div className="aspect-[2/3] bg-muted rounded-lg overflow-hidden relative">
              <img
                src={imageUrl}
                alt={movie.Name}
                className="object-cover w-full h-full"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm p-4 text-center -z-10">
                {movie.Name}
              </div>
            </div>
          </div>

          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{movie.Name}</h1>

            <div className="flex flex-wrap gap-2 mb-4">
              {movie.ProductionYear && (
                <Badge variant="secondary">{movie.ProductionYear}</Badge>
              )}
              {movie.RunTimeTicks && (
                <Badge variant="outline">
                  {formatDuration(movie.RunTimeTicks)}
                </Badge>
              )}
              {movie.OfficialRating && (
                <Badge variant="outline">{movie.OfficialRating}</Badge>
              )}
              {movie.Size && (
                <Badge variant="outline">{formatSize(movie.Size)}</Badge>
              )}
            </div>

            {movie.Genres && movie.Genres.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-4">
                {movie.Genres.map((genre) => (
                  <Badge key={genre} variant="outline" className="text-xs">
                    {genre}
                  </Badge>
                ))}
              </div>
            )}

            {movie.Overview && (
              <p className="text-muted-foreground mb-6 leading-relaxed">
                {movie.Overview}
              </p>
            )}

            <Button size="lg" onClick={handleDownload}>
              Descargar película
            </Button>
          </div>
        </div>

        <DownloadWarningDialog
          open={showDownloadDialog}
          onOpenChange={setShowDownloadDialog}
          downloadUrl={downloadUrl}
          fileName={downloadFileName}
        />
      </div>
    </div>
  );
}
