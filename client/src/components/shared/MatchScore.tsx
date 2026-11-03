import { cn } from "@/lib/utils";

interface MatchScoreProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

function getScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-500";
  if (score >= 60) return "text-blue-500";
  if (score >= 40) return "text-amber-500";
  return "text-red-500";
}

function getScoreRingColor(score: number): string {
  if (score >= 80) return "stroke-emerald-500";
  if (score >= 60) return "stroke-blue-500";
  if (score >= 40) return "stroke-amber-500";
  return "stroke-red-500";
}

function getScoreLabel(score: number): string {
  if (score >= 80) return "Excellent Match";
  if (score >= 60) return "Good Match";
  if (score >= 40) return "Moderate Match";
  return "Low Match";
}

const sizes = {
  sm: { ring: 40, stroke: 3, text: "text-xs", font: "text-sm" },
  md: { ring: 56, stroke: 4, text: "text-xs", font: "text-base" },
  lg: { ring: 80, stroke: 5, text: "text-sm", font: "text-xl" },
};

export function MatchScore({ score, size = "md", showLabel = true, className }: MatchScoreProps) {
  const { ring, stroke, text, font } = sizes[size];
  const radius = (ring - stroke * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <div className="relative" style={{ width: ring, height: ring }}>
        <svg width={ring} height={ring} className="-rotate-90">
          <circle
            cx={ring / 2}
            cy={ring / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            className="stroke-[var(--muted)]"
          />
          <circle
            cx={ring / 2}
            cy={ring / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={cn("transition-all duration-700", getScoreRingColor(score))}
          />
        </svg>
        <div className={cn("absolute inset-0 flex items-center justify-center font-bold", font, getScoreColor(score))}>
          {score}%
        </div>
      </div>
      {showLabel && (
        <span className={cn("font-medium", text, getScoreColor(score))}>
          {getScoreLabel(score)}
        </span>
      )}
    </div>
  );
}

