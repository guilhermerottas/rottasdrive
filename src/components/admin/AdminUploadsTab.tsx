import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CalendarIcon,
  FileText,
  Image as ImageIcon,
  Film,
  Music,
  Upload as UploadIcon,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatBytes, cn } from "@/lib/utils";
import { useAdminUploadsList } from "@/hooks/useAdminUploadsList";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { useAdminUsers } from "@/hooks/useAdminUsers";

const TIPO_PRESETS = [
  { label: "Todos", value: "all", prefix: null as string | null },
  { label: "Imagem", value: "image", prefix: "image/" },
  { label: "Vídeo", value: "video", prefix: "video/" },
  { label: "Áudio", value: "audio", prefix: "audio/" },
  { label: "PDF", value: "pdf", prefix: "application/pdf" },
] as const;

const ALL = "__all__";
const LIMIT = 200;

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function TipoIcon({ tipo }: { tipo: string | null }) {
  const t = tipo ?? "";
  if (t.startsWith("image/")) return <ImageIcon className="h-4 w-4 text-blue-500" />;
  if (t.startsWith("video/")) return <Film className="h-4 w-4 text-purple-500" />;
  if (t.startsWith("audio/")) return <Music className="h-4 w-4 text-pink-500" />;
  return <FileText className="h-4 w-4 text-muted-foreground" />;
}

export function AdminUploadsTab() {
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);

  const [fromDate, setFromDate] = useState<Date>(sevenDaysAgo);
  const [toDate, setToDate] = useState<Date>(today);
  const [workspaceId, setWorkspaceId] = useState<string>(ALL);
  const [uploadedBy, setUploadedBy] = useState<string>(ALL);
  const [tipoPreset, setTipoPreset] = useState<string>("all");

  const tipoPrefix = useMemo(
    () => TIPO_PRESETS.find((t) => t.value === tipoPreset)?.prefix ?? null,
    [tipoPreset],
  );

  const { data: workspaces } = useWorkspaces();
  const { users } = useAdminUsers();

  const { data: rows, isLoading } = useAdminUploadsList({
    from: startOfDay(fromDate).toISOString(),
    to: endOfDay(toDate).toISOString(),
    workspaceId: workspaceId === ALL ? null : workspaceId,
    uploadedBy: uploadedBy === ALL ? null : uploadedBy,
    tipoPrefix,
    limit: LIMIT,
  });

  const total = rows?.length ?? 0;
  const atLimit = total === LIMIT;

  const limparFiltros = () => {
    setFromDate(sevenDaysAgo);
    setToDate(today);
    setWorkspaceId(ALL);
    setUploadedBy(ALL);
    setTipoPreset("all");
  };

  return (
    <div className="space-y-4">
      {/* Barra de filtros */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* De */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">De</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(fromDate, "dd/MM/yyyy", { locale: ptBR })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={fromDate}
                  onSelect={(d) => d && setFromDate(d)}
                  locale={ptBR}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Até */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Até</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(toDate, "dd/MM/yyyy", { locale: ptBR })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={toDate}
                  onSelect={(d) => d && setToDate(d)}
                  locale={ptBR}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Workspace */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Workspace</label>
            <Select value={workspaceId} onValueChange={setWorkspaceId}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todos</SelectItem>
                {(workspaces ?? []).map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Uploader */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Quem enviou</label>
            <Select value={uploadedBy} onValueChange={setUploadedBy}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todos</SelectItem>
                {(users ?? []).map((u) => (
                  <SelectItem key={u.user_id} value={u.user_id}>
                    {u.nome || u.email || "(sem nome)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-3 flex items-end gap-3">
          {/* Tipo */}
          <div className="space-y-1.5 w-full md:w-48">
            <label className="text-xs font-medium text-muted-foreground">Tipo</label>
            <Select value={tipoPreset} onValueChange={setTipoPreset}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPO_PRESETS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button variant="ghost" size="sm" onClick={limparFiltros} className="gap-2">
            <X className="h-4 w-4" />
            Limpar filtros
          </Button>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <UploadIcon className="h-4 w-4 text-primary" />
            Uploads ({total})
          </h3>
          {atLimit && (
            <p className="text-xs text-muted-foreground">
              Mostrando os {LIMIT} mais recentes — restrinja o período pra ver mais
            </p>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        ) : total === 0 ? (
          <div className="h-32 flex items-center justify-center text-sm text-muted-foreground">
            Nenhum upload no período selecionado
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Arquivo</TableHead>
                  <TableHead>Workspace</TableHead>
                  <TableHead>Coleção</TableHead>
                  <TableHead>Pasta</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Tamanho</TableHead>
                  <TableHead>Quem enviou</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(rows ?? []).map((r) => (
                  <TableRow key={r.arquivo_id}>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {format(new Date(r.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="font-medium max-w-[260px] truncate">{r.nome}</TableCell>
                    <TableCell className="text-muted-foreground max-w-[140px] truncate">
                      {r.workspace_nome}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[160px] truncate">
                      {r.obra_nome}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[140px] truncate">
                      {r.pasta_nome ?? "—"}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        <TipoIcon tipo={r.tipo} />
                        {r.tipo ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-semibold whitespace-nowrap">
                      {formatBytes(r.tamanho)}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[160px] truncate">
                      {r.uploader_nome ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
