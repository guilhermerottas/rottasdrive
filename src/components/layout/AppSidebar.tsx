import { Link, useLocation } from "react-router-dom";
import { Building2, LayoutDashboard } from "lucide-react";
import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";
import { StorageGauge } from "@/components/StorageGauge";

const menuItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Obras", url: "/obras", icon: Building2 },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 min-h-screen bg-card border-r border-border flex flex-col">
      <div className="p-6 flex items-center gap-3">
        <img src={logo} alt="Logo" className="w-10 h-10" />
        <span className="font-bold text-lg">Rottas</span>
      </div>

      <nav className="flex-1 px-4 py-6">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.url || 
              (item.url === "/" && location.pathname === "/");
            
            return (
              <li key={item.title}>
                <Link
                  to={item.url}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.title}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <StorageGauge />
    </aside>
  );
}