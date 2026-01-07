import { Search, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserProfileButton } from "@/components/UserProfileButton";

interface AppHeaderProps {
  onUploadClick?: () => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  showUpload?: boolean;
}

export function AppHeader({ 
  onUploadClick, 
  searchValue = "", 
  onSearchChange,
  showUpload = false 
}: AppHeaderProps) {
  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Pesquisar..."
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="pl-10 bg-background border-border"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {showUpload && onUploadClick && (
          <Button onClick={onUploadClick} className="gap-2">
            <Upload className="h-4 w-4" />
            Upload
          </Button>
        )}
        <UserProfileButton />
      </div>
    </header>
  );
}
