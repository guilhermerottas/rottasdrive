import { useState } from "react";
import { X, Play } from "lucide-react";
import tutorialThumb from "@/assets/tutorial-thumb.png";
import { Button } from "@/components/ui/button";

const TUTORIAL_URL = "https://drive.google.com/file/d/12YwQHyzLtfNnYRiYTIPSQ10lNnfzE997/view?usp=sharing";

export function TutorialPopup() {
  const [visible, setVisible] = useState(() => {
    if (typeof window === "undefined") return false;
    return !localStorage.getItem("tutorial_dismissed");
  });

  if (!visible) return null;

  const handleClose = () => {
    localStorage.setItem("tutorial_dismissed", "1");
    setVisible(false);
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 w-80 rounded-xl border border-border bg-card shadow-2xl animate-in slide-in-from-bottom-4 fade-in duration-500">
      <div className="relative p-4">
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        <h3 className="text-sm font-semibold text-foreground pr-6 mb-3">
          Veja como utilizar o Rottas Drive
        </h3>

        <div className="relative rounded-lg overflow-hidden bg-muted aspect-video mb-3 flex items-center justify-center">
          <img src={tutorialThumb} alt="Tutorial preview" className="absolute inset-0 w-full h-full object-cover" />
          <div className="relative flex items-center justify-center rounded-full bg-black/50 h-10 w-10">
            <Play className="h-5 w-5 fill-white text-white" />
          </div>
        </div>

        <Button
          className="w-full gap-2"
          onClick={() => window.open(TUTORIAL_URL, "_blank")}
        >
          <Play className="h-4 w-4" />
          Assistir ao Tutorial
        </Button>
      </div>
    </div>
  );
}
