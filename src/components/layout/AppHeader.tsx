import { Search, Upload, FolderPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
import { UserProfileButton } from "@/components/UserProfileButton";

interface AppHeaderProps {
  onUploadClick?: () => void;
  onNewFolderClick?: () => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  showUpload?: boolean;
  showNewFolder?: boolean;
}

export function AppHeader({ 
  onUploadClick, 
  onNewFolderClick,
  searchValue = "", 
  onSearchChange,
  showUpload = false,
  showNewFolder = false
}: AppHeaderProps) {
  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 sm:px-6 sticky top-0 z-10">
      {/* LEFT: Action buttons (Google Drive style) */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {showNewFolder && onNewFolderClick && (
          <>
            {/* Desktop: with text */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onNewFolderClick}
              className="hidden sm:flex"
            >
              <FolderPlus className="mr-2 h-4 w-4" />
              Nova Pasta
            </Button>
            {/* Mobile: icon only */}
            <Button 
              variant="outline" 
              size="icon" 
              onClick={onNewFolderClick}
              className="sm:hidden h-9 w-9"
            >
              <FolderPlus className="h-4 w-4" />
            </Button>
          </>
        )}
        {showUpload && onUploadClick && (
          <>
            {/* Desktop: with text */}
            <HoverBorderGradient
              onClick={onUploadClick}
              className="hidden sm:flex items-center gap-2 text-sm font-medium"
            >
              <Upload className="h-4 w-4" />
              Upload
            </HoverBorderGradient>
            {/* Mobile: icon only */}
            <Button 
              variant="default" 
              size="icon" 
              onClick={onUploadClick}
              className="sm:hidden h-9 w-9"
            >
              <Upload className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {/* CENTER: Search */}
      <div className="flex-1 max-w-md mx-4">
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

      {/* RIGHT: User profile */}
      <div className="flex-shrink-0">
        <UserProfileButton />
      </div>
    </header>
  );
}
