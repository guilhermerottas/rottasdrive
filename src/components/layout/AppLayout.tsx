import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { MobileBottomNav } from "./MobileBottomNav";
import { useIsMobile } from "@/hooks/use-mobile";

interface AppLayoutProps {
  children: ReactNode;
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
    </div>
  );
}
