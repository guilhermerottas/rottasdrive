import { Link, useLocation } from "react-router-dom";
import { Building2, Star, User, ChevronLeft, ChevronRight, Trash2, Shield } from "lucide-react";
import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";
import { StorageGauge } from "@/components/StorageGauge";
import { useState } from "react";
import { useAuthContext } from "@/components/AuthProvider";

const baseMenuItems = [
  { title: "Coleções", url: "/home", icon: Building2 },
  { title: "Favoritos", url: "/favoritos", icon: Star },
  { title: "Lixeira", url: "/lixeira", icon: Trash2 },
  { title: "Perfil", url: "/perfil", icon: User },
];

export function AppSidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { isAdmin } = useAuthContext();

  // Add admin menu item only for admins
  const menuItems = isAdmin 
    ? [...baseMenuItems.slice(0, 3), { title: "Admin", url: "/admin", icon: Shield }, baseMenuItems[3]]
    : baseMenuItems;

  return (
    <aside 
      className={cn(
        "sticky top-0 h-screen bg-card border-r border-border flex flex-col transition-all duration-300",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-8 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card shadow-sm hover:bg-muted transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      <div className={cn("p-6 flex items-center gap-3", collapsed && "justify-center")}>
        <img src={logo} alt="Logo" className="w-10 h-10 object-contain aspect-square" />
        {!collapsed && <span className="font-bold text-lg">Rottas</span>}
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-6">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.url ||
              (item.url === "/home" && (location.pathname === "/" || location.pathname === "/home")) ||
              (item.url !== "/home" && location.pathname.startsWith(item.url));
            
            return (
              <li key={item.title}>
                <Link
                  to={item.url}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-medium",
                    collapsed && "justify-center px-2",
                    isActive
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                  title={collapsed ? item.title : undefined}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span>{item.title}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {!collapsed && <StorageGauge />}
    </aside>
  );
}
