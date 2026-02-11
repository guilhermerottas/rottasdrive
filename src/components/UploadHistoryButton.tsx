import React from "react";
import { Upload } from "lucide-react";
import { useUpload } from "@/contexts/UploadContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, AlertCircle, FileText, Loader2 } from "lucide-react";

export function UploadHistoryButton() {
    const { uploads, isOpen, setIsOpen } = useUpload();

    const pending = uploads.filter(u => u.status === "pending" || u.status === "uploading");
    const completed = uploads.filter(u => u.status === "completed");
    const failed = uploads.filter(u => u.status === "error");

    const showBadge = pending.length > 0;

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Upload className="h-5 w-5" />
                    {showBadge && (
                        <Badge
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full p-0 text-[10px]"
                        >
                            {pending.length}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
                <div className="flex items-center justify-between p-3 border-b">
                    <h4 className="font-semibold text-sm">Uploads</h4>
                    <span className="text-xs text-muted-foreground">
                        {completed.length} concluídos
                    </span>
                </div>
                <ScrollArea className="max-h-[300px]">
                    {uploads.length === 0 ? (
                        <div className="p-8 text-center text-sm text-muted-foreground">
                            Nenhum upload recente
                        </div>
                    ) : (
                        <div className="divide-y">
                            {uploads.slice().reverse().map(upload => (
                                <div key={upload.id} className="p-3 flex items-start gap-3 hover:bg-muted/50 transition-colors">
                                    <div className="flex-shrink-0 mt-0.5">
                                        {upload.status === "uploading" ? (
                                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                        ) : upload.status === "completed" ? (
                                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        ) : upload.status === "error" ? (
                                            <AlertCircle className="h-4 w-4 text-destructive" />
                                        ) : (
                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{upload.file.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {(upload.file.size / 1024 / 1024).toFixed(1)} MB
                                            {upload.status === "error" && ` • ${upload.error}`}
                                        </p>
                                        {upload.status === "uploading" && (
                                            <div className="h-1 w-full bg-secondary mt-2 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary transition-all duration-300"
                                                    style={{ width: `${upload.progress}%` }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
                {uploads.length > 0 && (
                    <div className="p-2 border-t bg-muted/20">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-xs"
                            onClick={() => setIsOpen(true)}
                        >
                            Ver progresso detalhado
                        </Button>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}
