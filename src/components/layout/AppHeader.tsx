import { Search, Upload, FolderPlus, X, Clapperboard } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
import { UserProfileButton } from "@/components/UserProfileButton";
import { UploadHistoryButton } from "@/components/UploadHistoryButton";

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
            className="pl-10 pr-10 bg-background border-border"
          />
          {searchValue && (
            <button
              type="button"
              onClick={() => onSearchChange?.("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* RIGHT: User profile */}
      <div className="flex-shrink-0 flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="hidden sm:flex gap-2 text-muted-foreground"
          onClick={() => window.open("https://drive.google.com/file/d/12YwQHyzLtfNnYRiYTIPSQ10lNnfzE997/view?usp=sharing", "_blank")}
        >
          <Clapperboard className="h-4 w-4" />
          Ver Tutorial
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="sm:hidden text-muted-foreground"
          onClick={() => window.open("https://drive.google.com/file/d/12YwQHyzLtfNnYRiYTIPSQ10lNnfzE997/view?usp=sharing", "_blank")}
        >
          <Clapperboard className="h-4 w-4" />
        </Button>
        <UploadHistoryButton />
        <UserProfileButton />
      </div>
    </header>
  );
}
