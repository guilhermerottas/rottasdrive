import { useAuthContext } from "@/components/AuthProvider";
import { useChat } from "@/contexts/ChatContext";
import AIChatButton from "./AIChatButton";
import AIChatPanel from "./AIChatPanel";

export default function ChatWidget() {
  const { user, loading } = useAuthContext();
  const { isOpen, openChat, closeChat } = useChat();

  // Esconde se ainda carregando auth ou se for visitante (rotas públicas)
  if (loading || !user) return null;

  return (
    <>
      <AIChatButton isOpen={isOpen} onClick={openChat} />
      <AIChatPanel isOpen={isOpen} onClose={closeChat} />
    </>
  );
}
