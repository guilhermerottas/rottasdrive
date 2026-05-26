import {
  FolderKanban,
  Megaphone,
  Building2,
  Briefcase,
  Hammer,
  Wrench,
  PenTool,
  Camera,
  ShoppingCart,
  Calculator,
  Scale,
  Users,
  HeartHandshake,
  Truck,
  Lightbulb,
  Palette,
  type LucideIcon,
} from "lucide-react";

/** Ícones disponíveis para um workspace. A chave é o que vai persistido no banco. */
export const WORKSPACE_ICONES: Record<string, LucideIcon> = {
  "folder-kanban": FolderKanban,
  megaphone: Megaphone,
  building: Building2,
  briefcase: Briefcase,
  hammer: Hammer,
  wrench: Wrench,
  "pen-tool": PenTool,
  camera: Camera,
  "shopping-cart": ShoppingCart,
  calculator: Calculator,
  scale: Scale,
  users: Users,
  handshake: HeartHandshake,
  truck: Truck,
  lightbulb: Lightbulb,
  palette: Palette,
};

/** Chave do ícone padrão quando o workspace não tem ícone definido. */
export const WORKSPACE_ICONE_PADRAO = "folder-kanban";

/** Resolve a chave do ícone para o componente lucide, com fallback no padrão. */
export function getWorkspaceIcon(icone: string | null | undefined): LucideIcon {
  return WORKSPACE_ICONES[icone ?? ""] ?? WORKSPACE_ICONES[WORKSPACE_ICONE_PADRAO];
}
