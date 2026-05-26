import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Props {
  isOpen: boolean;
  onClick: () => void;
}

export default function AIChatButton({ isOpen, onClick }: Props) {
  if (isOpen) return null;
  return (
    <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-[60] safe-pb safe-pr">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={onClick}
              size="icon"
              aria-label="Abrir Assistente IA"
              className="h-12 w-12 rounded-full shadow-xl ring-4 ring-primary/15 hover:ring-primary/25 transition-all hover:scale-105"
            >
              <Sparkles className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Assistente IA</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
