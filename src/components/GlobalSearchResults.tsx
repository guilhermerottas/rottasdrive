import { useState } from "react";
import { FileText, Image, File, Folder, Building2 } from "lucide-react";
import { SearchResult } from "@/hooks/useGlobalSearch";
import { FileViewer } from "./FileViewer";
import { SearchResultSkeleton } from "./skeletons/SearchResultSkeleton";
import { useNavigate } from "react-router-dom";

interface GlobalSearchResultsProps {
  results: SearchResult[];
  isLoading: boolean;
  searchTerm: string;
}

function getFileIcon(tipo: string | null) {
  if (!tipo) return <File className="h-5 w-5 text-muted-foreground" />;
  if (tipo.startsWith("image/")) return <Image className="h-5 w-5 text-blue-500" />;
  if (tipo === "application/pdf") return <FileText className="h-5 w-5 text-red-500" />;
  return <File className="h-5 w-5 text-muted-foreground" />;
}

function formatFileSize(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function GlobalSearchResults({ results, isLoading, searchTerm }: GlobalSearchResultsProps) {
  const navigate = useNavigate();
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<SearchResult | null>(null);

  const handleFileClick = (file: SearchResult) => {
    setSelectedFile(file);
    setViewerOpen(true);
  };

  const handleNavigateToLocation = (file: SearchResult) => {
    if (file.pasta_id) {
      navigate(`/obra/${file.obra_id}/pasta/${file.pasta_id}`);
    } else {
      navigate(`/obra/${file.obra_id}`);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Buscando arquivos...</h2>
        <div className="grid gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <SearchResultSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <File className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold mb-2">Nenhum arquivo encontrado</h2>
        <p className="text-muted-foreground">
          Não encontramos arquivos com "{searchTerm}"
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
        <h2 className="text-base sm:text-lg font-semibold">
          Resultados da busca ({results.length})
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Arquivos encontrados para "{searchTerm}"
        </p>
      </div>

      <div className="grid gap-2 sm:gap-3">
        {results.map((file) => (
          <div
            key={file.id}
            className="flex items-center gap-2.5 sm:gap-4 p-2.5 sm:p-4 bg-card border border-border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer group min-w-[350px] w-full"
            onClick={() => handleFileClick(file)}
          >
            {/* File thumbnail or icon */}
            <div className="flex-shrink-0 w-10 h-10 sm:w-[100px] sm:h-[100px] rounded-md sm:rounded-lg overflow-hidden bg-muted flex items-center justify-center">
              {file.tipo?.startsWith("image/") ? (
                <img
                  src={file.arquivo_url}
                  alt={file.nome}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full">
                  {getFileIcon(file.tipo)}
                </div>
              )}
            </div>

            {/* File info */}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate text-xs sm:text-base">{file.nome}</p>
              <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 flex-wrap">
                <span className="flex items-center gap-0.5 sm:gap-1">
                  <Building2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  <span className="truncate max-w-[80px] sm:max-w-none">{file.obra_nome}</span>
                </span>
                {file.pasta_nome && (
                  <>
                    <span>/</span>
                    <span className="flex items-center gap-0.5 sm:gap-1">
                      <Folder className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      <span className="truncate max-w-[60px] sm:max-w-none">{file.pasta_nome}</span>
                    </span>
                  </>
                )}
                <span className="sm:hidden text-muted-foreground">· {formatFileSize(file.tamanho)}</span>
              </div>
            </div>

            {/* File size - desktop only */}
            <div className="flex-shrink-0 text-sm text-muted-foreground hidden sm:block">
              {formatFileSize(file.tamanho)}
            </div>

            {/* Navigate button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNavigateToLocation(file);
              }}
              className="flex-shrink-0 px-2 sm:px-3 py-1 text-[10px] sm:text-xs bg-primary/10 text-primary rounded-md sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-primary/20"
            >
              Ir para pasta
            </button>
          </div>
        ))}
      </div>

      {selectedFile && (
        <FileViewer
          open={viewerOpen}
          onOpenChange={setViewerOpen}
          arquivo={{
            id: selectedFile.id,
            nome: selectedFile.nome,
            arquivo_url: selectedFile.arquivo_url,
            tipo: selectedFile.tipo,
            tamanho: selectedFile.tamanho,
            created_at: selectedFile.created_at,
            obra_id: selectedFile.obra_id,
            pasta_id: selectedFile.pasta_id,
            updated_at: selectedFile.created_at,
            deleted_at: null,
            deleted_by: null,
            uploaded_by: null,
          }}
        />
      )}
    </div>
  );
}
