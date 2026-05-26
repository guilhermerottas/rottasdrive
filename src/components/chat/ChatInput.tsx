import { useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  onSend: (message: string) => void;
  isLoading: boolean;
  placeholder?: string;
}

const MAX_INPUT_HEIGHT = 96;

export default function ChatInput({ onSend, isLoading, placeholder }: Props) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_INPUT_HEIGHT)}px`;
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    autoResize(e.target);
  };

  const handleSend = () => {
    if (!value.trim() || isLoading) return;
    onSend(value.trim());
    setValue("");
    if (ref.current) ref.current.style.height = "auto";
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const sendDisabled = !value.trim() || isLoading;

  return (
    <div className="border-t border-border p-3 shrink-0 bg-card">
      <div className="flex items-end gap-2">
        <Textarea
          ref={ref}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? "Pergunte sobre os arquivos…"}
          className="min-h-[44px] max-h-[96px] overflow-y-auto resize-none text-sm rounded-xl"
          rows={1}
          disabled={isLoading}
        />
        <Button
          onClick={handleSend}
          disabled={sendDisabled}
          size="icon"
          aria-label="Enviar"
          className="h-11 w-11 shrink-0 rounded-xl shadow-sm transition-transform hover:scale-105 disabled:hover:scale-100"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
      <p className="text-[11px] text-muted-foreground mt-2 text-center">
        IA pode cometer erros. Confira em arquivos importantes.
      </p>
    </div>
  );
}
