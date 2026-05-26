import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useLocation, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAIChat } from "@/hooks/useAIChat";

type AIChat = ReturnType<typeof useAIChat>;
type PanelView = "chat" | "list";

interface ChatContextValue extends AIChat {
  isOpen: boolean;
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
  panelView: PanelView;
  setPanelView: (v: PanelView) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const chat = useAIChat();
  const [isOpen, setIsOpen] = useState(false);
  const [panelView, setPanelView] = useState<PanelView>("chat");

  // Escopo automático pela rota
  const location = useLocation();
  const params = useParams<{ obraId?: string; workspaceId?: string }>();

  useEffect(() => {
    const path = location.pathname;
    if (params.obraId && path.startsWith("/obra/")) {
      // Pega workspace_id da obra (sem await aqui — fire and forget)
      void resolveObraWorkspace(params.obraId).then((workspaceId) => {
        chat.setScope({ obra_id: params.obraId!, workspace_id: workspaceId });
      });
    } else if (params.workspaceId && path.startsWith("/workspace/")) {
      chat.setScope({ workspace_id: params.workspaceId, obra_id: null });
    } else {
      chat.setScope({ workspace_id: null, obra_id: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, params.obraId, params.workspaceId]);

  const openChat = useCallback(() => setIsOpen(true), []);
  const closeChat = useCallback(() => setIsOpen(false), []);
  const toggleChat = useCallback(() => setIsOpen((v) => !v), []);

  return (
    <ChatContext.Provider
      value={{
        ...chat,
        isOpen,
        openChat,
        closeChat,
        toggleChat,
        panelView,
        setPanelView,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat deve ser usado dentro de <ChatProvider>");
  return ctx;
}

async function resolveObraWorkspace(obraId: string): Promise<string | null> {
  const { data } = await supabase
    .from("obras")
    .select("workspace_id")
    .eq("id", obraId)
    .maybeSingle();
  return data?.workspace_id ?? null;
}
