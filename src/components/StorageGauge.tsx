import { useStorageUsage } from "@/hooks/useStorageUsage";

export function StorageGauge() {
  const { data, isLoading } = useStorageUsage();

  if (isLoading) {
    return (
      <div className="p-4 flex flex-col items-center">
        <div className="w-32 h-16 bg-muted rounded-t-full animate-pulse" />
      </div>
    );
  }

  const usedGB = data?.usedGB || 0;
  const maxGB = data?.maxGB || 100;
  const percentage = Math.min((usedGB / maxGB) * 100, 100);

  // Calculate the arc for the gauge
  const radius = 60;
  const strokeWidth = 12;
  const circumference = Math.PI * radius;
  
  // Determine color based on usage
  const getColor = (pct: number) => {
    if (pct < 50) return "hsl(var(--primary))";
    if (pct < 75) return "hsl(45, 93%, 47%)"; // Yellow/amber
    return "hsl(0, 84%, 60%)"; // Red
  };

  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const formatUsage = (gb: number) => {
    if (gb < 1) {
      const mb = gb * 1024;
      return `${mb.toFixed(1)} MB`;
    }
    return `${gb.toFixed(2)} GB`;
  };

  return (
    <div className="p-4 flex flex-col items-center border-t border-border">
      <div className="relative w-36 h-20">
        <svg
          className="w-full h-full"
          viewBox="0 0 140 80"
          fill="none"
        >
          {/* Background arc */}
          <path
            d="M 10 70 A 60 60 0 0 1 130 70"
            stroke="hsl(var(--muted))"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="none"
          />
          {/* Colored progress arc */}
          <path
            d="M 10 70 A 60 60 0 0 1 130 70"
            stroke={getColor(percentage)}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
          <span className="text-lg font-bold">{formatUsage(usedGB)}</span>
          <span className="text-xs text-muted-foreground">de {maxGB} GB</span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground mt-1">Armazenamento</span>
    </div>
  );
}
