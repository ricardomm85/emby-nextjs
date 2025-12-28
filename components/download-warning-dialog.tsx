"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Copy, Download } from "lucide-react";
import { toast } from "sonner";

interface DownloadWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  downloadUrl: string;
  fileName: string;
}

export function DownloadWarningDialog({
  open,
  onOpenChange,
  downloadUrl,
  fileName,
}: DownloadWarningDialogProps) {
  const copyFileName = () => {
    navigator.clipboard.writeText(fileName);
    toast.success("Nombre copiado al portapapeles");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-500">
            <AlertTriangle className="h-5 w-5" />
            <DialogTitle>Advertencia de Seguridad</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-3">
          <DialogDescription>
            Esta descarga utiliza una conexión <strong>HTTP (no segura)</strong> en
            lugar de HTTPS. Tu navegador puede bloquearla por razones de seguridad.
          </DialogDescription>

          <div className="text-sm">
            <strong>Para descargar de forma segura:</strong>
          </div>

          <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
            <li>Haz clic derecho en el enlace de abajo</li>
            <li>Selecciona &quot;Guardar enlace como...&quot;</li>
            <li>Elige dónde guardar el archivo</li>
            <li>Renombra el archivo si es necesario</li>
          </ol>
        </div>

        <div className="space-y-3">
          <div className="p-3 bg-muted rounded-lg">
            <a
              href={downloadUrl}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline break-all"
              target="_blank"
              rel="noopener noreferrer"
            >
              {fileName}
            </a>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copyFileName}
              className="flex-1"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copiar nombre
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                window.open(downloadUrl, "_blank");
                onOpenChange(false);
              }}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              Intentar descarga
            </Button>
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
