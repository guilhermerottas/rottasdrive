import { Play, FileSpreadsheet, FileText, File } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface FilePreviewThumbnailProps {
  tipo: string | null;
  url: string;
  nome: string;
  className?: string;
  iconSize?: "sm" | "md" | "lg";
}

const isImage = (tipo: string | null) => tipo?.startsWith("image/");
const isPdf = (tipo: string | null) => tipo === "application/pdf";
const isVideo = (tipo: string | null) => tipo?.startsWith("video/");
const isExcel = (tipo: string | null) =>
  tipo === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
  tipo === "application/vnd.ms-excel" ||
  tipo === "application/x-excel";
const isWord = (tipo: string | null) =>
  tipo === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
  tipo === "application/msword";

const iconSizes = {
  sm: "h-8 w-8",
  md: "h-16 w-16",
  lg: "h-20 w-20",
};

export function FilePreviewThumbnail({
  tipo,
  url,
  nome,
  className,
  iconSize = "md",
}: FilePreviewThumbnailProps) {
  if (isImage(tipo)) {
    return (
      <img
        src={url}
        alt={nome}
        className={cn("w-full h-auto object-cover", className)}
        loading="lazy"
      />
    );
  }

  if (isPdf(tipo)) {
    return (
      <div className={cn("relative w-full h-full flex items-center justify-center bg-muted", className)}>
        <iframe
          src={`${url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
          title={nome}
          className="w-full h-full pointer-events-none border-0"
          style={{ minHeight: 200 }}
        />
        <Badge className="absolute top-2 left-2 bg-red-500 hover:bg-red-600 text-white border-0 text-[10px] px-1.5 py-0.5">
          PDF
        </Badge>
      </div>
    );
  }

  if (isVideo(tipo)) {
    return (
      <div className={cn("relative w-full h-full flex items-center justify-center bg-black/90", className)}>
        <video
          src={url}
          className="w-full h-full object-cover"
          preload="metadata"
          muted
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-12 w-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
            <Play className="h-6 w-6 text-black ml-0.5" fill="black" />
          </div>
        </div>
      </div>
    );
  }

  if (isExcel(tipo)) {
    return (
      <div className={cn("flex items-center justify-center bg-muted w-full h-full", className)}>
        <FileSpreadsheet className={cn(iconSizes[iconSize], "text-green-600")} />
      </div>
    );
  }

  if (isWord(tipo)) {
    return (
      <div className={cn("flex items-center justify-center bg-muted w-full h-full", className)}>
        <FileText className={cn(iconSizes[iconSize], "text-blue-600")} />
      </div>
    );
  }

  return (
    <div className={cn("flex items-center justify-center bg-muted w-full h-full", className)}>
      <File className={cn(iconSizes[iconSize], "text-muted-foreground")} />
    </div>
  );
}
