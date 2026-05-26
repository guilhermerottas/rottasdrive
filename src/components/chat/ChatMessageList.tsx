import { useEffect, useRef } from "react";
import { Sparkles, ArrowRight, Search, FileText, MapPin } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ChatMessage as ChatMessageType } from "@/hooks/useAIChat";
import ChatMessage from "./ChatMessage";

interface Props {
  messages: ChatMessageType[];
  onSuggest?: (prompt: string) => void;
  scopeLabel?: string;
}

const SUGGESTIONS: { text: string; icon: typeof Sparkles }[] = [
  { text: "Qual o prazo de entrega no contrato?", icon: FileText },
  { text: "Resumir o memorial descritivo", icon: Sparkles },
  { text: "Onde está a planta do piso 2?", icon: Search },
  { text: "O que diz o orçamento sobre fundação?", icon: MapPin },
];

export default function ChatMessageList({ messages, onSuggest, scopeLabel }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <ScrollArea className="flex-1 min-h-0 chat-scroll [&_[data-radix-scroll-area-viewport]>div]:!block">
      <div className="p-4 space-y-4 w-full overflow-x-hidden">
        {messages.length === 0 && (
          <div className="flex flex-col items-center text-center py-6 px-2">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-md mb-4">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <h3 className="text-base font-semibold text-foreground">
              Olá! Como posso ajudar?
            </h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-[300px]">
              Pergunte sobre conteúdo dos arquivos, ou encontre uma planta/contrato pelo nome.
            </p>

            {scopeLabel && (
              <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[11px] font-medium">
                <MapPin className="h-3 w-3" />
                {scopeLabel}
              </span>
            )}

            <div className="mt-6 w-full space-y-2">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground/80 font-semibold text-left">
                Sugestões
              </p>
              {SUGGESTIONS.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.text}
                    type="button"
                    onClick={() => onSuggest?.(s.text)}
                    disabled={!onSuggest}
                    className="group w-full flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2 text-left text-sm text-foreground hover:border-primary/40 hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="truncate">{s.text}</span>
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
