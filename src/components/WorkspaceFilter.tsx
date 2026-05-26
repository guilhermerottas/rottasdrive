import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Workspace } from "@/hooks/useWorkspaces";
import { getWorkspaceIcon } from "@/components/workspaceIcons";
import { FolderKanban } from "lucide-react";

interface WorkspaceFilterProps {
  value: string;
  onChange: (value: string) => void;
  workspaces: Workspace[];
  className?: string;
}

export function WorkspaceFilter({
  value,
  onChange,
  workspaces,
  className,
}: WorkspaceFilterProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className ?? "w-[220px]"}>
        <SelectValue placeholder="Workspace" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">
          <div className="flex items-center gap-2">
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
            <span>Todos os workspaces</span>
          </div>
        </SelectItem>
        {workspaces.map((ws) => {
          const Icon = getWorkspaceIcon(ws.icone);
          return (
            <SelectItem key={ws.id} value={ws.id}>
              <div className="flex items-center gap-2">
                <Icon
                  className="h-4 w-4"
                  style={{ color: ws.cor ?? undefined }}
                />
                <span className="truncate">{ws.nome}</span>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
