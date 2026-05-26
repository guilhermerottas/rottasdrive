import { Trash2, MessageSquare } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useChatConversas, useDeleteConversa } from "@/hooks/useChatHistory";
import { useChat } from "@/contexts/ChatContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ChatConversationList() {
  const { data, isLoading } = useChatConversas();
  const remove = useDeleteConversa();
  const { loadConversa, setPanelView, activeConversaId, newConversation } = useChat();

  const handleOpen = async (id: string) => {
    await loadConversa(id);
    setPanelView("chat");
  };

  return (
    <ScrollArea className="flex-1 min-h-0 chat-scroll">
      <div className="p-2">
        {isLoading ? (
          <div className="space-y-2 p-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : !data || data.length === 0 ? (
          <div className="text-center py-12 px-4">
            <MessageSquare className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Sem conversas ainda</p>
            <p className="text-xs text-muted-foreground mt-1">
              Comece uma nova conversa pra ver seu histórico aqui.
            </p>
          </div>
        ) : (
          data.map((c) => {
            const isActive = c.id === activeConversaId;
            return (
              <div
                key={c.id}
                className={`group flex items-center gap-2 rounded-lg p-2 hover:bg-muted/60 transition-colors ${
                  isActive ? "bg-muted/80" : ""
                }`}
              >
                <button
                  onClick={() => handleOpen(c.id)}
                  className="flex-1 min-w-0 text-left"
                >
                  <p className="text-sm font-medium truncate">{c.titulo || "Conversa"}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {format(new Date(c.updated_at), "dd MMM yyyy HH:mm", { locale: ptBR })}
                  </p>
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isActive) newConversation();
                    remove.mutate(c.id);
                  }}
                  title="Apagar conversa"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            );
          })
        )}
      </div>
    </ScrollArea>
  );
}
