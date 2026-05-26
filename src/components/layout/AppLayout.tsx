import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { MobileBottomNav } from "./MobileBottomNav";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";

interface AppLayoutProps {
  children: ReactNode;
}

function ChatComingSoonFab() {
  return (
    <div className="fixed bottom-6 right-6 z-[60]">
      <div className="relative">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() =>
                  toast.info("Assistente IA — em breve", {
                    description:
                      "Chat com IA sobre os arquivos da coleção está em desenvolvimento.",
                  })
                }
                size="icon"
                aria-label="Assistente IA — em breve"
                className="h-12 w-12 rounded-full shadow-xl ring-4 ring-primary/15 hover:ring-primary/25 transition-all hover:scale-105"
              >
                <Sparkles className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Assistente IA — em breve</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <span className="pointer-events-none absolute -top-3 -right-2 z-10 rounded-full bg-foreground text-background text-[10px] font-semibold px-2 py-0.5 shadow-md whitespace-nowrap">
          Em breve
        </span>
      </div>
    </div>
  );
}

export function AppLayout({ children }: AppLayoutProps) {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen flex w-full bg-background">
      {!isMobile && <AppSidebar />}
      <main className={`flex-1 flex flex-col overflow-hidden ${isMobile ? "pb-20" : ""}`}>
        {children}
      </main>
      {isMobile && <MobileBottomNav />}
      {!isMobile && <ChatComingSoonFab />}
    </div>
  );
}
