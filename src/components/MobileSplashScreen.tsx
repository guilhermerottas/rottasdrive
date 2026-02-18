import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import logo from "@/assets/logo.png";

export function MobileSplashScreen() {
  const isMobile = useIsMobile();
  const [visible, setVisible] = useState(() => {
    if (typeof window === "undefined") return false;
    return !sessionStorage.getItem("splash_shown");
  });
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (!visible || !isMobile) return;

    sessionStorage.setItem("splash_shown", "1");

    const duration = 3000;
    const interval = 30;
    const step = 100 / (duration / interval);

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + step;
        if (next >= 100) {
          clearInterval(timer);
          setFadeOut(true);
          setTimeout(() => setVisible(false), 400);
          return 100;
        }
        return next;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [visible, isMobile]);

  if (!visible || !isMobile) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white transition-opacity duration-400"
      style={{ opacity: fadeOut ? 0 : 1 }}
    >
      <img src={logo} alt="Logo" className="w-20 h-20 mb-8" />
      <div className="w-48 h-1 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-black rounded-full transition-all duration-75"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
