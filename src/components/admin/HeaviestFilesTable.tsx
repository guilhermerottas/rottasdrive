import { HardDrive } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatBytes } from "@/lib/utils";
import { useHeaviestFiles } from "@/hooks/useAdminAnalytics";

export function HeaviestFilesTable() {
  const { data, isLoading } = useHeaviestFiles(20);
  const files = data ?? [];

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <HardDrive className="h-4 w-4 text-primary" />
        Top 20 arquivos mais pesados
      </h3>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      ) : files.length === 0 ? (
        <div className="h-32 flex items-center justify-center text-sm text-muted-foreground">
          Nenhum arquivo encontrado
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead>Arquivo</TableHead>
                <TableHead>Coleção</TableHead>
                <TableHead>Pasta</TableHead>
                <TableHead className="text-right">Tamanho</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {files.map((f, i) => (
                <TableRow key={f.arquivo_id}>
                  <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                  <TableCell className="font-medium max-w-[260px] truncate">{f.nome}</TableCell>
                  <TableCell className="text-muted-foreground max-w-[180px] truncate">
                    {f.obra_nome}
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-[160px] truncate">
                    {f.pasta_nome ?? "—"}
                  </TableCell>
                  <TableCell className="text-right font-semibold whitespace-nowrap">
                    {formatBytes(f.tamanho)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
