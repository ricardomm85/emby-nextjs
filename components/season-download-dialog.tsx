"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Download, Copy } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface EpisodeDownload {
  id: string;
  url: string;
  fileName: string;
  episodeNumber: number;
  episodeName: string;
}

interface SeasonDownloadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  seasonNumber: number;
  episodes: EpisodeDownload[];
}

export function SeasonDownloadDialog({
  open,
  onOpenChange,
  seasonNumber,
  episodes,
}: SeasonDownloadDialogProps) {
  const copyFileName = (fileName: string) => {
    navigator.clipboard.writeText(fileName);
    toast.success("Nombre copiado al portapapeles");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-500">
            <AlertTriangle className="h-5 w-5" />
            <DialogTitle>Descargar Temporada {seasonNumber}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-3 flex-1 overflow-hidden flex flex-col">
          <DialogDescription>
            Esta descarga utiliza conexiones <strong>HTTP (no seguras)</strong>.
            Para descargar, haz clic derecho en cada enlace y selecciona &quot;Guardar
            enlace como...&quot;
          </DialogDescription>

          <div className="text-sm font-medium">
            {episodes.length} episodio{episodes.length !== 1 ? "s" : ""} para descargar:
          </div>

          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-2">
              {episodes.map((episode) => (
                <div
                  key={episode.id}
                  className="p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium mb-1">
                        E{String(episode.episodeNumber).padStart(2, "0")} -{" "}
                        {episode.episodeName}
                      </div>
                      <a
                        href={episode.url}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline break-all"
                        target="_blank"
                        rel="noopener noreferrer"
                        title={episode.fileName}
                      >
                        {episode.fileName}
                      </a>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => copyFileName(episode.fileName)}
                        title="Copiar nombre del archivo"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Download className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="border-t pt-3">
            <p className="text-sm text-muted-foreground text-center">
              Haz clic derecho en cada enlace de arriba y selecciona &quot;Guardar enlace como...&quot;
            </p>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Descargas bajo tu propia responsabilidad. Asegúrate de confiar en el
            servidor de origen.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
