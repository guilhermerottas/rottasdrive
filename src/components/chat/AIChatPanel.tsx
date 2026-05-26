import { useQuery } from "@tanstack/react-query";
import { Sparkles, ChevronRight, ChevronLeft, SquarePen, History, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useChat } from "@/contexts/ChatContext";
import { supabase } from "@/integrations/supabase/client";
import ChatMessageList from "./ChatMessageList";
import ChatInput from "./ChatInput";
import ChatConversationList from "./ChatConversationList";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function AIChatPanel({ isOpen, onClose }: Props) {
  const {
    messages,
    isLoading,
    sendMessage,
    newConversation,
    panelView,
    setPanelView,
    scope,
  } = useChat();

  const isList = panelView === "list";

  const { data: scopeInfo } = useQuery({
    queryKey: ["chat-scope-info", scope.obra_id, scope.workspace_id],
    queryFn: async () => {
      if (scope.obra_id) {
        const { data } = await supabase
          .from("obras")
          .select("nome, workspace:workspaces(nome)")
          .eq("id", scope.obra_id)
          .maybeSingle();
        if (!data) return null;
        return {
          tipo: "obra" as const,
          label: data.nome,
          parent: (data.workspace as { nome: string } | null)?.nome,
        };
      }
      if (scope.workspace_id) {
        const { data } = await supabase
          .from("workspaces")
          .select("nome")
          .eq("id", scope.workspace_id)
          .maybeSingle();
        if (!data) return null;
        return { tipo: "workspace" as const, label: data.nome, parent: undefined };
      }
      return null;
    },
    enabled: !!(scope.obra_id || scope.workspace_id),
    staleTime: 60_000,
  });

  const scopeLabel = scopeInfo
    ? scopeInfo.tipo === "obra"
      ? `${scopeInfo.parent ? scopeInfo.parent + " › " : ""}${scopeInfo.label}`
      : scopeInfo.label
    : null;

  const startNew = () => {
    newConversation();
    setPanelView("chat");
  };

  return (
    <div
      className={cn(
        "fixed right-0 top-0 z-[55]",
        "h-[100dvh] w-full md:h-full md:w-[420px] md:max-w-[90vw]",
        "bg-card md:border-l md:border-border shadow-2xl",
        "flex flex-col safe-pt safe-pb",
        "transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "translate-x-full pointer-events-none",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border shrink-0">
        {isList ? (
          <div className="flex items-center gap-2 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setPanelView("chat")}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              title="Voltar"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-sm font-semibold truncate">Conversas</h2>
          </div>
        ) : (
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-sm shrink-0">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="flex flex-col leading-tight min-w-0">
              <h2 className="text-sm font-semibold truncate">Assistente IA</h2>
              {scopeLabel ? (
                <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate">{scopeLabel}</span>
                </p>
              ) : (
                <p className="text-[11px] text-muted-foreground truncate">
                  Sem filtro — buscando em tudo
                </p>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center gap-1 shrink-0">
          {!isList && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={startNew}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                title="Nova conversa"
              >
                <SquarePen className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPanelView("list")}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                title="Histórico de conversas"
              >
                <History className="h-4 w-4" />
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            title="Fechar chat"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isList ? (
        <ChatConversationList />
      ) : (
        <>
          <ChatMessageList
            messages={messages}
            onSuggest={sendMessage}
            scopeLabel={scopeLabel ?? undefined}
          />
          <ChatInput onSend={sendMessage} isLoading={isLoading} />
        </>
      )}
    </div>
  );
}
