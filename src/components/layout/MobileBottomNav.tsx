import { Building2, Star, User, Shield } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/components/AuthProvider";

const baseNavItems = [
  { title: "Obras", url: "/", icon: Building2 },
  { title: "Favoritos", url: "/favoritos", icon: Star },
  { title: "Perfil", url: "/perfil", icon: User },
];

export function MobileBottomNav() {
  const location = useLocation();
  const { isAdmin } = useAuthContext();

  // Add admin menu item only for admins
  const navItems = isAdmin 
    ? [...baseNavItems.slice(0, 2), { title: "Admin", url: "/admin", icon: Shield }, baseNavItems[2]]
    : baseNavItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-[0_-4px_12px_rgba(0,0,0,0.08)] pb-[max(env(safe-area-inset-bottom),24px)]">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.url || 
            (item.url === "/" && location.pathname === "/") ||
            (item.url !== "/" && location.pathname.startsWith(item.url));

          return (
            <Link
              key={item.url}
              to={item.url}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon 
                className={cn(
                  "h-6 w-6 transition-transform",
                  isActive && "scale-110"
                )} 
              />
              <span className={cn(
                "text-[10px] font-medium",
                isActive && "font-semibold"
              )}>
                {item.title}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
