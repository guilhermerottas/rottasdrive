import React from "react";
import { useUpload } from "@/contexts/UploadContext";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { X, Minimize2, Maximize2, FileCheck, FileWarning, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export function UploadProgress() {
    const { uploads, isOpen, setIsOpen, minimized, setMinimized, removeUpload, clearCompleted } = useUpload();

    if (!isOpen || uploads.length === 0) return null;

    const pending = uploads.filter(u => u.status === "pending" || u.status === "uploading");
    const uploading = uploads.find(u => u.status === "uploading");
    const completed = uploads.filter(u => u.status === "completed");
    const failed = uploads.filter(u => u.status === "error");

    const total = uploads.length;
    const done = completed.length + failed.length;
    const percent = total > 0 ? (done / total) * 100 : 0;

    return (
        <div
            className={cn(
                "fixed bottom-4 right-4 z-50 bg-card border shadow-xl rounded-lg overflow-hidden transition-all duration-300 ease-in-out",
                minimized ? "w-72 h-12" : "w-80 max-h-[500px]"
            )}
        >
            {/* Header */}
            <div
                className="flex items-center justify-between px-3 h-12 bg-muted/50 border-b cursor-pointer"
                onClick={() => setMinimized(!minimized)}
            >
                <div className="flex items-center gap-2 text-sm font-medium">
                    {uploading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    ) : failed.length > 0 ? (
                        <FileWarning className="h-4 w-4 text-destructive" />
                    ) : (
                        <FileCheck className="h-4 w-4 text-green-500" />
                    )}
                    <span>
                        {uploading
                            ? `Enviando ${pending.length} arquivo${pending.length > 1 ? 's' : ''}...`
                            : completed.length === total
                                ? "Concluído"
                                : `${done} de ${total} concluídos`
                        }
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                            e.stopPropagation();
                            setMinimized(!minimized);
                        }}
                    >
                        {minimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsOpen(false);
                        }}
                    >
                        <X className="h-3 w-3" />
                    </Button>
                </div>
            </div>

            {/* Minimizar só esconde o conteúdo abaixo */}
            {!minimized && (
                <div className="flex flex-col max-h-[450px]">
                    <div className="p-3 border-b bg-background">
                        <Progress value={percent} className="h-2" />
                    </div>

                    <ScrollArea className="flex-1">
                        <div className="p-2 space-y-1">
                            {uploads.slice().reverse().map((upload) => (
                                <div
                                    key={upload.id}
                                    className="flex items-center gap-3 p-2 rounded hover:bg-muted/50 group text-sm"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate">{upload.file.name}</div>
                                        <div className="text-xs text-muted-foreground flex items-center justify-between">
                                            <span>{(upload.file.size / 1024 / 1024).toFixed(1)} MB</span>
                                            <span className={cn(
                                                upload.status === "completed" && "text-green-500",
                                                upload.status === "error" && "text-destructive",
                                                upload.status === "uploading" && "text-primary"
                                            )}>
                                                {upload.status === "completed" && "Concluído"}
                                                {upload.status === "error" && "Erro"}
                                                {upload.status === "uploading" && "Enviando..."}
                                                {upload.status === "pending" && "Pendente"}
                                            </span>
                                        </div>
                                    </div>
                                    {upload.status !== "uploading" && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => removeUpload(upload.id)}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            )}
        </div>
    );
}
