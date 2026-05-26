import { Sparkles, User, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessage as ChatMessageType } from "@/hooks/useAIChat";
import ChatMarkdown from "./ChatMarkdown";
import ChatCitations from "./ChatCitations";
import ChatFileResult from "./ChatFileResult";

interface Props {
  message: ChatMessageType;
}

function BotAvatar() {
  return (
    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-sm shrink-0">
      <Sparkles className="h-4 w-4 text-primary-foreground" />
    </div>
  );
}

export default function ChatMessage({ message }: Props) {
  const isUser = message.role === "user";

  if (message.isLoading) {
    return (
      <div className="flex items-start gap-2">
        <BotAvatar />
        <div className="bg-card border border-border shadow-sm rounded-2xl rounded-tl-sm px-3 py-2 flex items-center gap-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {message.statusLabel || "Pensando…"}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-start gap-2", isUser && "flex-row-reverse")}>
      {isUser ? (
        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
          <User className="h-4 w-4 text-muted-foreground" />
        </div>
      ) : (
        <BotAvatar />
      )}

      <div className={cn("min-w-0 max-w-[85%] space-y-1.5", isUser ? "items-end" : "flex-1")}>
        <div
          className={cn(
            "min-w-0 max-w-full overflow-hidden px-3.5 py-2.5 text-sm",
            isUser
              ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm"
              : message.isError
                ? "bg-destructive/10 text-destructive border border-destructive/20 rounded-2xl rounded-tl-sm"
                : "bg-card border border-border shadow-sm rounded-2xl rounded-tl-sm",
          )}
        >
          {isUser || message.isError ? (
            <span className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
              {message.isError && (
                <AlertCircle className="h-4 w-4 inline mr-1 align-text-bottom" />
              )}
              {message.content}
            </span>
          ) : (
            <ChatMarkdown content={message.content || "(sem resposta)"} />
          )}
        </div>

        {!isUser && message.fileResults && message.fileResults.length > 0 && (
          <ChatFileResult results={message.fileResults} />
        )}

        {!isUser && message.citacoes && message.citacoes.length > 0 && (
          <ChatCitations citacoes={message.citacoes} />
        )}
      </div>
    </div>
  );
}
