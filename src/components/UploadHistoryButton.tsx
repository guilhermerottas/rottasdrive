import React, { useState } from "react";
import { Upload } from "lucide-react";
import { useUpload } from "@/contexts/UploadContext";
import { useRecentUploads } from "@/hooks/useRecentUploads";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, AlertCircle, FileText, Loader2 } from "lucide-react";
import { formatBytes } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function UploadHistoryButton() {
    const { uploads, setIsOpen } = useUpload();
    const [popoverOpen, setPopoverOpen] = useState(false);

    const sessionInFlight = uploads.filter(
        (u) => u.status === "pending" || u.status === "uploading" || u.status === "error"
    );
    const sessionCompletedCount = uploads.filter((u) => u.status === "completed").length;
    const showBadge = sessionInFlight.filter((u) => u.status !== "error").length > 0;

    // Últimas 24h do banco — só busca quando o popover está aberto pra economizar
    const { data: recentUploads, isLoading: recentLoading } = useRecentUploads(24, {
        enabled: popoverOpen,
    });

    return (
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Upload className="h-5 w-5" />
                    {showBadge && (
                        <Badge
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full p-0 text-[10px]"
                        >
                            {sessionInFlight.filter((u) => u.status !== "error").length}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-96 p-0">
                <div className="flex items-center justify-between p-3 border-b">
                    <h4 className="font-semibold text-sm">Uploads</h4>
                    <span className="text-xs text-muted-foreground">
                        {sessionCompletedCount} concluídos nesta sessão
                    </span>
                </div>

                <ScrollArea className="max-h-[400px]">
                    {/* Em andamento (sessão) */}
                    {sessionInFlight.length > 0 && (
                        <>
                            <div className="px-3 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                Em andamento
                            </div>
                            <div className="divide-y">
                                {sessionInFlight.slice().reverse().map((upload) => (
                                    <div key={upload.id} className="p-3 flex items-start gap-3">
                                        <div className="flex-shrink-0 mt-0.5">
                                            {upload.status === "uploading" ? (
                                                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                            ) : upload.status === "error" ? (
                                                <AlertCircle className="h-4 w-4 text-destructive" />
                                            ) : (
                                                <FileText className="h-4 w-4 text-muted-foreground" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{upload.file.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatBytes(upload.file.size)}
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
                            <Separator />
                        </>
                    )}

                    {/* Últimas 24h (banco) */}
                    <div className="px-3 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Últimas 24h
                    </div>
                    {recentLoading ? (
                        <div className="p-3 space-y-3">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <Skeleton className="h-4 w-4 rounded-full mt-0.5" />
                                    <div className="flex-1 space-y-1">
                                        <Skeleton className="h-3 w-40" />
                                        <Skeleton className="h-3 w-24" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : !recentUploads || recentUploads.length === 0 ? (
                        <div className="p-6 text-center text-sm text-muted-foreground">
                            Nenhum upload nas últimas 24h
                        </div>
                    ) : (
                        <div className="divide-y">
                            {recentUploads.map((u) => (
                                <div key={u.id} className="p-3 flex items-start gap-3 hover:bg-muted/50 transition-colors">
                                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{u.nome}</p>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {u.obra_nome ?? "—"} · {formatBytes(u.tamanho)} ·{" "}
                                            {formatDistanceToNow(new Date(u.created_at), {
                                                locale: ptBR,
                                                addSuffix: true,
                                            })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                {sessionInFlight.length > 0 && (
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
